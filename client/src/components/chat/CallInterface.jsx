import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function CallInterface({ session }) {
    const [callState, setCallState] = useState('idle'); // idle, calling, incoming, active
    const [callType, setCallType] = useState('video');
    const [partner, setPartner] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [profileName, setProfileName] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    
    const pcRef = useRef(null);
    const channelRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const currentUser = {
        id: session?.user?.id,
        role: session?.user?.user_metadata?.role
    };

    // STUN Servers
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };

    useEffect(() => {
        const fetchPartnerName = async (partnerId) => {
            const table = currentUser.role === 'gcs' ? 'hospitality_profiles' : 'gcs_profiles';
            const { data } = await supabase.from(table).select('company_name').eq('id', partnerId).single();
            if (data) setProfileName(data.company_name);
        };

        if (partner?.id) fetchPartnerName(partner.id);
    }, [partner?.id]);

    useEffect(() => {
        // Listen for internal "initiate call" events
        const handleInitCall = (e) => {
            const { type, conversation } = e.detail;
            setCallType(type);
            setConversation(conversation);
            const partnerId = currentUser.role === 'gcs' ? conversation.hospitality_id : conversation.gcs_id;
            setPartner({ id: partnerId });
            startOutgoingCall(type, conversation, partnerId);
        };

        window.addEventListener('init-call', handleInitCall);
        return () => window.removeEventListener('init-call', handleInitCall);
    }, [session]);

    useEffect(() => {
        if (!session?.user?.id) return;

        // Global Signaling Listener - Listen to MY unique ID
        const mySignalingChannel = supabase.channel(`signaling:${session.user.id}`, {
            config: { broadcast: { self: true } }
        });

        mySignalingChannel
            .on('broadcast', { event: 'call-offer' }, ({ payload }) => {
                if (callState !== 'idle') return; 
                setCallState('incoming');
                setCallType(payload.type);
                setConversation(payload.conversation);
                setPartner({ id: payload.from });
                toast("Incoming Call...", { icon: '📞' });
            })
            .on('broadcast', { event: 'call-accepted' }, async ({ payload }) => {
                if (callState === 'calling') {
                    setCallState('active');
                    await createPeerConnection();
                    const offer = await pcRef.current.createOffer();
                    await pcRef.current.setLocalDescription(offer);
                    sendSignaling('sdp-offer', { sdp: offer });
                } else if (callState === 'incoming') {
                    // Another tab accepted the call
                    setCallState('idle');
                }
            })
            .on('broadcast', { event: 'call-declined' }, () => {
                if (callState !== 'idle') {
                    toast.error("Call declined");
                    endCall(false);
                }
            })
            .on('broadcast', { event: 'sdp-offer' }, async ({ payload }) => {
                if (callState !== 'active') setCallState('active');
                await createPeerConnection();
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                const answer = await pcRef.current.createAnswer();
                await pcRef.current.setLocalDescription(answer);
                sendSignaling('sdp-answer', { sdp: answer });
            })
            .on('broadcast', { event: 'sdp-answer' }, async ({ payload }) => {
                if (pcRef.current) {
                    await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                }
            })
            .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
                if (pcRef.current) {
                    try {
                        await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                    } catch (e) {
                         console.warn("ICE candidate error", e);
                    }
                }
            })
            .on('broadcast', { event: 'call-ended' }, () => {
                endCall(false);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    channelRef.current = mySignalingChannel;
                }
            });

        return () => {
            supabase.removeChannel(mySignalingChannel);
        };
    }, [session?.user?.id, callState, callType]);

    const sendSignaling = (event, payload) => {
        if (!partner?.id) return;
        // Broadcast to the PARTNER's signaling channel
        const partnerChannel = supabase.channel(`signaling:${partner.id}`);
        partnerChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                partnerChannel.send({
                    type: 'broadcast',
                    event,
                    payload: { ...payload, from: currentUser.id }
                }).then(() => {
                    // Optional: remove after sending
                    setTimeout(() => supabase.removeChannel(partnerChannel), 1000);
                });
            }
        });
    };

    const startOutgoingCall = async (type, conv, partnerId) => {
        setCallState('calling');
        sendSignaling('call-offer', { type, conversation: conv });
    };

    const acceptCall = async () => {
        sendSignaling('call-accepted', {});
        setCallState('active');
        // Synchronize other tabs of THIS user
        channelRef.current?.send({
            type: 'broadcast',
            event: 'call-accepted',
            payload: { by: 'me' }
        });
    };

    const declineCall = () => {
        sendSignaling('call-declined', {});
        endCall(true);
    };

    const endCall = (notify = true) => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (notify) sendSignaling('call-ended', {});
        
        setCallState('idle');
        setLocalStream(null);
        setRemoteStream(null);
        setPartner(null);
        setConversation(null);
        setIsMuted(false);
        setIsCameraOff(false);
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        if (localStream && callType === 'video') {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(!isCameraOff);
        }
    };

    const createPeerConnection = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: callType === 'video',
            audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(rtcConfig);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignaling('ice-candidate', { candidate: event.candidate });
            }
        };

        pcRef.current = pc;
    };

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callState]);

    if (callState === 'idle') return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#075E54] flex flex-col items-center justify-between p-8 animate-fade-in text-white font-sans">
            {/* Background for Video */}
            {callState === 'active' && callType === 'video' && (
                <div className="absolute inset-0 bg-black z-0">
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover opacity-90"
                    />
                    {/* Local Video PIP */}
                    <div className="absolute top-10 right-6 w-28 h-44 bg-[#202c33] rounded-2xl overflow-hidden border-2 border-white/20 z-10 shadow-2xl animate-fade-in">
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="relative z-10 w-full flex flex-col items-center pt-8">
                <div className="flex items-center gap-2 mb-4 bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md">
                    <span className="material-symbols-outlined text-sm text-green-400">lock</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">End-to-End Encrypted</span>
                </div>
                
                {/* Profile Section for Voice/Calling */}
                {(callType === 'audio' || callState !== 'active') && (
                    <div className="flex flex-col items-center gap-6 mt-10 animate-fade-in">
                        <div className="relative">
                            <div className={`w-32 h-32 rounded-full bg-[#128C7E] flex items-center justify-center text-5xl font-serif italic border-4 border-white/10 shadow-2xl ${callState === 'calling' || callState === 'incoming' ? 'animate-pulse' : ''}`}>
                                {profileName?.charAt(0) || 'P'}
                            </div>
                            {callState === 'active' && (
                                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-[#075E54] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xs">mic</span>
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            <h2 className="text-4xl font-serif italic mb-2 tracking-tight">
                                {profileName || 'Network Partner'}
                            </h2>
                            <p className="text-sm font-bold uppercase tracking-[0.3em] text-green-400">
                                {callState === 'calling' ? 'Ringing...' : 
                                 callState === 'incoming' ? 'WhatsApp Call' : 
                                 '00:00'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Active Video Overlay Text */}
            {callState === 'active' && callType === 'video' && (
                <div className="relative z-10 text-center mb-auto pt-4">
                     <h2 className="text-2xl font-serif italic drop-shadow-lg">{profileName || 'Partner'}</h2>
                     <p className="text-xs font-bold uppercase tracking-widest opacity-80 drop-shadow-md">Secure Video Link</p>
                </div>
            )}

            {/* Main Action Controls */}
            <div className="relative z-20 w-full max-w-md mb-10">
                <div className="bg-[#202c33]/95 backdrop-blur-xl rounded-[40px] p-6 shadow-2xl border border-white/10 flex items-center justify-between mx-4">
                    {callState === 'incoming' ? (
                        <>
                            <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={declineCall}
                                    className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-3xl">call_end</span>
                                </button>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Decline</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={acceptCall}
                                    className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg active:scale-95 animate-bounce"
                                >
                                    <span className="material-symbols-outlined text-3xl">call</span>
                                </button>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Answer</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={toggleMute}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
                            </button>
                            <button 
                                onClick={toggleCamera}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                                title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                            >
                                <span className="material-symbols-outlined">{isCameraOff ? 'videocam_off' : 'videocam'}</span>
                            </button>
                            <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <span className="material-symbols-outlined text-white">cameraswitch</span>
                            </button>
                            <button 
                                onClick={() => endCall()}
                                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-red-500/20 active:scale-90"
                            >
                                <span className="material-symbols-outlined text-3xl">call_end</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
