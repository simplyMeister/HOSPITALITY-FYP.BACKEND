import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CallInterface from './chat/CallInterface';
import toast from 'react-hot-toast';

const SidebarItem = ({ to, icon, label, collapsed, badge }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`relative flex items-center gap-4 px-6 py-3 rounded-2xl transition-all duration-300 group ${
        active 
        ? 'font-bold' 
        : 'text-ben-text hover:bg-ben-bg/50'
      } ${collapsed ? 'justify-center px-0 mx-3' : 'mx-2'}`}
      style={active ? { color: 'var(--theme-color, #16a34a)', backgroundColor: 'var(--theme-color-faint)' } : {}}
    >
      <div className={`flex items-center justify-center transition-all duration-300 ${collapsed ? 'w-10 h-10' : ''}`}>
        <span 
          className={`material-symbols-outlined text-xl transition-all duration-500 ${active ? '' : 'text-ben-muted group-hover:text-ben-text group-hover:scale-110'}`}
          style={active ? { color: 'var(--theme-color, #16a34a)' } : {}}
        >
          {icon}
        </span>
      </div>
      {!collapsed && <span className="text-[10px] uppercase font-bold tracking-[0.2em] whitespace-nowrap overflow-hidden transition-all duration-300">{label}</span>}
      {badge > 0 && (
        <span 
          className={`absolute text-white text-[8px] font-black rounded-full flex items-center justify-center transition-all duration-300 ${collapsed ? 'top-1 right-1 w-3 h-3' : 'right-4 top-1/2 -translate-y-1/2 w-4 h-4'}`}
          style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
};

export default function DashboardLayout({ children, roleTitle, onNotificationClick }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileName, setProfileName] = useState('Node Operator');
  const [notifications, setNotifications] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({ total: 0, partnership: 0, operation: 0 });
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) {
            const code = `${new Date().getDate()}${session.user.id.substring(0, 4)}`.toUpperCase();
            setSessionId(code);
        }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const segments = location.pathname.split('/');
  const baseGroup = segments[1] ? `/${segments[1]}` : '';
  const isHI = baseGroup === '/hi';
  const isGCS = baseGroup === '/gcs';

  useEffect(() => {
    let channel;
    let msgChannel;

    const fetchUnreadCounts = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      const { count: total } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('recipient_id', currentSession.user.id).eq('is_read', false);
      const { count: partnership } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('recipient_id', currentSession.user.id).eq('category', 'partnership').eq('is_read', false);
      const { count: operation } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('recipient_id', currentSession.user.id).eq('category', 'operation').eq('is_read', false);

      let messagesUnread = 0;
      const { data: convData } = await supabase.from('conversations').select('gcs_unread_count, hi_unread_count').or(`gcs_id.eq.${currentSession.user.id},hospitality_id.eq.${currentSession.user.id}`);
      if (convData) {
         convData.forEach(c => {
             if (currentSession.user.user_metadata.role === 'gcs') messagesUnread += c.gcs_unread_count || 0;
             else messagesUnread += c.hi_unread_count || 0;
         });
      }

      setUnreadCounts({ total: total || 0, partnership: partnership || 0, operation: operation || 0, messages: messagesUnread });
    };

    const fetchInitialData = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      const role = currentSession.user.user_metadata?.role;
      if (role === 'hospitality') {
         const { data } = await supabase.from('hospitality_profiles').select('business_name').eq('id', currentSession.user.id).single();
         if (data) setProfileName(data.business_name);
      } else if (role === 'gcs') {
         const { data } = await supabase.from('gcs_profiles').select('company_name').eq('id', currentSession.user.id).single();
         if (data) setProfileName(data.company_name);
      } else if (role === 'individual') {
         const { data } = await supabase.from('profiles').select('full_name').eq('id', currentSession.user.id).single();
         if (data) setProfileName(data.full_name);
      }

      const { data: notifData } = await supabase.from('notifications').select('*').eq('recipient_id', currentSession.user.id).order('created_at', { ascending: false }).limit(10);
      if (notifData) setNotifications(notifData);
      fetchUnreadCounts();

      channel = supabase.channel(`user-notifs-${currentSession.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${currentSession.user.id}` }, (payload) => {
          fetchUnreadCounts();
          if (payload.new && payload.new.recipient_id !== currentSession.user.id) return;
          if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new, ...prev].slice(0, 10));
              toast.success(payload.new.title || "New notification");
          } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          }
      }).subscribe();

      msgChannel = supabase.channel(`user-msgs-${currentSession.user.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => { fetchUnreadCounts(); }).subscribe();
    };

    fetchInitialData();
    return () => {
      if (channel) supabase.removeChannel(channel);
      if (msgChannel) supabase.removeChannel(msgChannel);
    };
  }, []);

  // Scroll Reveal Implementation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.05, rootMargin: "0px 0px -50px 0px" });

    const applyObservation = () => {
        const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
        elements.forEach(el => observer.observe(el));
    };

    applyObservation();
    const mutationObserver = new MutationObserver(() => applyObservation());
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
        observer.disconnect();
        mutationObserver.disconnect();
    };
  }, [children]);

  const markAsRead = async (id) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;
      await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', currentSession.user.id).eq('is_read', false);
      toast.success("All cleared");
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      toast.success("Session terminated");
  };

  const pageLabel = (() => {
    const last = segments[segments.length - 1];
    if (!last || last === segments[1]) return 'Dashboard';
    return last.charAt(0).toUpperCase() + last.slice(1);
  })();

  return (
    <div className="h-screen bg-ben-bg selection:bg-ben-text selection:text-white flex overflow-hidden">
      <div className="grid-bg fixed inset-0 opacity-20 pointer-events-none"></div>

      <aside className={`h-full flex flex-col border-r border-ben-border bg-white z-20 transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20' : 'w-80'}`}>
        <div className={`mb-6 pt-10 flex ${isCollapsed ? 'flex-col items-center px-0' : 'justify-between items-center px-6'}`}>
          {!isCollapsed && <Link to="/" className="text-3xl font-serif font-black tracking-tight text-ben-text">Eco<span style={{ color: 'var(--theme-color, #16a34a)' }}>Flow</span></Link>}
          <button onClick={toggleSidebar} className="w-10 h-10 rounded-full border border-ben-border flex items-center justify-center hover:bg-white transition-all">
            <span className={`material-symbols-outlined text-ben-muted transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`}>chevron_left</span>
          </button>
        </div>

        <nav className={`flex-1 space-y-1 ${isCollapsed ? 'px-2' : 'px-6'}`}>
          <SidebarItem to={`${baseGroup}`} icon="dashboard" label="Dashboard" collapsed={isCollapsed} />
          <SidebarItem to={`${baseGroup}/analytics`} icon="insights" label="Analytics" collapsed={isCollapsed} />
          <SidebarItem to={`${baseGroup}/ecosystem`} icon="hub" label="Ecosystem" collapsed={isCollapsed} />
          {isHI && (
            <>
              <div className={`py-2 ${isCollapsed ? 'hidden' : ''}`}><span className="text-[8px] font-black uppercase tracking-[0.25em] text-ben-muted/60 px-6">Operations</span></div>
              <SidebarItem to="/hi/operations" icon="local_shipping" label="Operations" collapsed={isCollapsed} badge={unreadCounts.operation} />
              <SidebarItem to="/hi/messages" icon="forum" label="Messages" collapsed={isCollapsed} badge={unreadCounts.messages} />
              <SidebarItem to="/hi/ecocoins" icon="eco" label="EcoCoins" collapsed={isCollapsed} />
            </>
          )}
          {isGCS && (
            <>
              <div className={`py-2 ${isCollapsed ? 'hidden' : ''}`}><span className="text-[8px] font-black uppercase tracking-[0.25em] text-ben-muted/60 px-6">Network</span></div>
              <SidebarItem to="/gcs/requests" icon="person_add" label="Link Requests" collapsed={isCollapsed} badge={unreadCounts.partnership} />
              <SidebarItem to="/gcs/partners" icon="handshake" label="Partners" collapsed={isCollapsed} />
              <SidebarItem to="/gcs/messages" icon="forum" label="Messages" collapsed={isCollapsed} badge={unreadCounts.messages} />
              <SidebarItem to="/gcs/equipment" icon="sensors" label="My Equipment" collapsed={isCollapsed} />
            </>
          )}
          <SidebarItem to={`${baseGroup}/settings`} icon="settings" label="Settings" collapsed={isCollapsed} />
        </nav>

      </aside>

      <main className="flex-1 relative z-10 overflow-y-auto h-full reveal reveal-delay-200">
        <CallInterface session={session} />
        <header className="sticky top-0 z-30 px-10 py-6 flex justify-between items-center bg-ben-bg border-b border-ben-border/50">
            <div>
                <h2 className="text-sm font-sans text-ben-muted tracking-tight">System / <span className="text-ben-text font-bold uppercase tracking-widest text-[10px] underline underline-offset-4 decoration-ben-border">{pageLabel}</span></h2>
            </div>
            <div className="flex items-center gap-6">
                <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="w-10 h-10 rounded-full border border-ben-border flex items-center justify-center hover:bg-white relative">
                    <span className="material-symbols-outlined text-ben-text">notifications</span>
                    {unreadCounts.total > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce">{unreadCounts.total}</span>}
                  </button>
                  {showNotifications && (
                    <div className="absolute top-12 right-0 w-80 bg-white rounded-3xl border border-ben-border shadow-2xl p-4 z-50 animate-fade-in origin-top-right">
                       <div className="flex justify-between items-center mb-4 px-2">
                           <h4 className="font-serif italic font-bold">Alerts</h4>
                           <button onClick={markAllAsRead} className="text-[8px] font-bold uppercase tracking-widest text-[var(--theme-color)] hover:underline">Mark all read</button>
                       </div>
                       <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                           {notifications.length === 0 ? <p className="text-[10px] uppercase font-bold text-ben-muted text-center py-6">No new alerts.</p> : notifications.map((n) => (
                               <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} className={`p-4 rounded-xl text-left cursor-pointer transition-colors ${n.is_read ? 'opacity-60 hover:bg-ben-bg' : 'border border-ben-border/20'}`} style={!n.is_read ? { backgroundColor: 'var(--theme-color-faint)' } : {}}>
                                   <h5 className="text-[11px] font-bold text-ben-text uppercase tracking-widest mb-1">{n.title}</h5>
                                   <p className="text-xs text-ben-muted leading-relaxed">{n.message}</p>
                               </div>
                           ))}
                       </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleLogout}
                        className="w-10 h-10 rounded-full border border-ben-border flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all group"
                        title="Sign Out"
                    >
                        <span className="material-symbols-outlined text-ben-muted group-hover:text-red-500">logout</span>
                    </button>
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-bold text-ben-text uppercase tracking-widest">{profileName}</p>
                        <p className="text-[10px] text-ben-muted">Session: {sessionId || '0042'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-ben-text border border-white/20 flex items-center justify-center text-white font-serif italic text-lg">{profileName.charAt(0)}</div>
                </div>
            </div>
        </header>

        <div className="px-10 pb-20 mt-4 reveal">
          {children}
        </div>
      </main>
    </div>
  );
}
