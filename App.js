import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    StatusBar,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    FlatList,
    Platform,
    ActivityIndicator,
    Modal,
    Animated,
    KeyboardAvoidingView,
    Keyboard,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Search,
    Bell,
    User as UserIcon,
    LayoutGrid,
    MapPin,
    ChevronLeft,
    ChevronRight,
    LogIn,
    Zap,
    Users as UsersIcon,
    CheckCircle2,
    MinusCircle,
    HelpCircle,
    ArrowLeft,
    GraduationCap,
    LogOut,
    X,
    Activity,
    UserCircle,
    Clock,
    Shield,
    Eye,
    EyeOff,
} from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Hooks and API
import { useFirebaseData } from './src/hooks/useFirebase';
import { vtopLogin } from './src/api/vtop';
import * as storage from './src/utils/storage';
import { PandaMascot, PandaHands, PandaPaws } from './src/components/PandaMascot';

const { width, height } = Dimensions.get('window');

// ============================================
// DESIGN SYSTEM - Light Theme (shadcn/ui style)
// ============================================
const COLORS = {
    // Background colors
    background: '#FAFAFA',
    card: '#FFFFFF',
    cardBorder: '#F1F5F9',

    // Primary/Dark colors
    primary: '#000000',
    primaryForeground: '#FFFFFF',

    // Secondary colors
    secondary: '#F1F5F9',
    secondaryForeground: '#64748B',

    // Status colors
    success: '#15803D',
    successLight: '#DCFCE7',
    successBorder: '#86EFAC',

    destructive: '#B91C1C',
    destructiveLight: '#FEE2E2',
    destructiveBorder: '#FECACA',

    // Neutral colors
    muted: '#F1F5F9',
    mutedForeground: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // Text colors
    foreground: '#000000',
    foregroundMuted: '#64748B',

    // Ring/Focus
    ring: 'rgba(0, 0, 0, 0.1)',
};

const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
};

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const StatusBadge = ({ status }) => {
    const isAvailable = status === 'AVAILABLE';
    const isBusy = status === 'BUSY';

    const getBadgeStyle = () => {
        if (isAvailable) return { bg: COLORS.successLight, text: COLORS.success };
        if (isBusy) return { bg: COLORS.destructiveLight, text: COLORS.destructive };
        return { bg: COLORS.muted, text: COLORS.mutedForeground };
    };

    const style = getBadgeStyle();

    return (
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
            <Text style={[styles.badgeText, { color: style.text }]}>{status}</Text>
        </View>
    );
};

// ============================================
// FACULTY CARD COMPONENT
// ============================================
const FacultyCard = ({ cabinId, name, data, count, isQueued, onToggleNotify }) => {
    const status = data?.status || "UNKNOWN";
    const isAvailable = status === "AVAILABLE";
    const isBusy = status === "BUSY";

    const getCardBorderColor = () => {
        if (isAvailable) return COLORS.successBorder;
        if (isBusy) return COLORS.destructiveBorder;
        return COLORS.border;
    };

    const getCardBgColor = () => {
        if (isAvailable) return '#F0FDF4';
        if (isBusy) return '#FEF2F2';
        return COLORS.card;
    };

    return (
        <View style={[styles.card, { backgroundColor: getCardBgColor(), borderColor: getCardBorderColor() }]}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <View style={styles.cardAvatar}>
                    <UserIcon size={16} color={COLORS.mutedForeground} />
                </View>
                <StatusBadge status={status} />
            </View>

            {/* Card Body */}
            <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={2}>{name || cabinId}</Text>
                <View style={styles.cardLocation}>
                    <MapPin size={10} color={COLORS.mutedForeground} />
                    <Text style={styles.cardLocationText}>{cabinId}</Text>
                </View>
            </View>

            {/* Stats Row */}
            <View style={styles.cardStats}>
                <View style={styles.statItem}>
                    <View style={styles.statLabelRow}>
                        <Activity size={10} color={COLORS.mutedForeground} />
                        <Text style={styles.statLabel}>TIME</Text>
                    </View>
                    <Text style={styles.statValue}>{data?.updatedAt?.split(' ')[1] || "N/A"}</Text>
                </View>
                <View style={styles.statItem}>
                    <View style={styles.statLabelRow}>
                        <UsersIcon size={10} color={COLORS.mutedForeground} />
                        <Text style={styles.statLabel}>WAIT</Text>
                    </View>
                    <Text style={styles.statValue}>{count}</Text>
                </View>
            </View>

            {/* Action Button */}
            {!isAvailable ? (
                <TouchableOpacity
                    style={[styles.cardActionBtn, isQueued && styles.cardActionBtnQueued]}
                    onPress={() => onToggleNotify(cabinId)}
                    activeOpacity={0.8}
                >
                    <Bell size={12} color={isQueued ? COLORS.mutedForeground : "#FFF"} />
                    <Text style={[styles.cardActionBtnText, isQueued && styles.cardActionBtnTextQueued]}>
                        {isQueued ? "Queued" : "Notify Me"}
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.cardAvailableTag}>
                    <Text style={styles.cardAvailableTagText}>AVAILABLE NOW</Text>
                </View>
            )}
        </View>
    );
};

// ============================================
// FILTER PILL COMPONENT
// ============================================
const FilterPill = ({ item, isActive, onPress }) => {
    const Icon = item.icon;
    return (
        <TouchableOpacity
            style={[styles.filterPill, isActive && styles.filterPillActive]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Icon size={14} color={item.color} />
            <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                {item.label}
            </Text>
        </TouchableOpacity>
    );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function App() {
    const { faculty, config, subsCount, loading, subscribeToFaculty, unsubscribeFromFaculty } = useFirebaseData();
    const [mySubs, setMySubs] = useState([]); // Track cabinIds queued by current user
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [activeTab, setActiveTab] = useState('HOME');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    // VTOP State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [vtopFaculty, setVtopFaculty] = useState([]);
    const [credentials, setCredentials] = useState(null);
    const [showLogin, setShowLogin] = useState(false);

    // Pagination State
    const [pageIndex, setPageIndex] = useState(0);
    const scrollRef = useRef(null);

    // Panda State
    const [isUsernameFocused, setIsUsernameFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [isSwitchingSemester, setIsSwitchingSemester] = useState(false);
    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [showSemesterPicker, setShowSemesterPicker] = useState(false);
    const pandaScale = useRef(new Animated.Value(1)).current;

    const shiftY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true);
            Animated.parallel([
                Animated.timing(pandaScale, {
                    toValue: 0.9,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(shiftY, {
                    toValue: -120, // Move up less (-120 instead of -220)
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
            Animated.parallel([
                Animated.timing(pandaScale, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(shiftY, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);
    // Load Persistence
    useEffect(() => {
        (async () => {
            const creds = await storage.getCredentials();
            const savedFaculty = await storage.getData('vtop_faculty');
            const savedSemesters = await storage.getData('vtop_semesters');
            const savedSelectedSem = await storage.getData('vtop_selected_semester');

            if (creds && savedFaculty) {
                setCredentials(creds);
                setVtopFaculty(savedFaculty);
                setSemesters(savedSemesters || []);
                setSelectedSemester(savedSelectedSem || null);
                setIsLoggedIn(true);
            }

            const savedSubs = await storage.getData('my_notifications_subs');
            if (savedSubs) setMySubs(savedSubs);

            // Request permission
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') console.log('Notification permissions not granted');
        })();
    }, []);

    // Status Watcher for Push Notifications
    const lastStatuses = useRef({});
    useEffect(() => {
        mySubs.forEach(cabinId => {
            const currentStatus = faculty[cabinId]?.status;
            const lastStatus = lastStatuses.current[cabinId];

            if (lastStatus && lastStatus !== 'AVAILABLE' && currentStatus === 'AVAILABLE') {
                // Trigger notification
                Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Faculty Available! 🟢",
                        body: `${config[cabinId] || cabinId} is now available in cabin.`,
                        data: { cabinId },
                    },
                    trigger: null,
                });

                // Auto-clear from queue as per requirement (Wait count must be set to 0 - happens in handleToggle)
                // Actually the user said: when Dr X is available, user gets notification.
                // Re-reading: "the wait count must be set to 0 and user should get push notification"
                // My interpretation: When Dr X becomes available, the people waiting see wait: 0 (globally) and get pinged.
                handleToggleNotify(cabinId, true); // Auto-remove from mySubs and decrement
            }
            if (currentStatus) lastStatuses.current[cabinId] = currentStatus;
        });
    }, [faculty, mySubs]);

    const handleLogin = async () => {
        if (!username || !password) return;
        setIsLoggingIn(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const data = await vtopLogin({ username, password });
        if (data.success) {
            setCredentials({ username, password });
            setVtopFaculty(data.faculty);
            setSemesters(data.semesters);
            const defaultSem = data.semesters[0];
            setSelectedSemester(defaultSem);
            setIsLoggedIn(true);
            setShowLogin(false);
            setActiveTab('MY');

            await storage.saveCredentials({ username, password });
            await storage.saveData('vtop_faculty', data.faculty);
            await storage.saveData('vtop_semesters', data.semesters);
            await storage.saveData('vtop_selected_semester', defaultSem);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            alert(data.error || "Login Failed");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setIsLoggingIn(false);
    };

    const handleSemesterChange = async (semester) => {
        if (semester.id === selectedSemester?.id) {
            setShowSemesterPicker(false);
            return;
        }

        setIsSwitchingSemester(true);
        setShowSemesterPicker(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const data = await vtopLogin({
            username: credentials.username,
            password: credentials.password,
            semesterId: semester.id
        });

        if (data.success) {
            setVtopFaculty(data.faculty);
            setSelectedSemester(semester);
            await storage.saveData('vtop_faculty', data.faculty);
            await storage.saveData('vtop_selected_semester', semester);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            alert(data.error || "Failed to switch semester");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setIsSwitchingSemester(false);
    };

    const handleLogout = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await storage.clearAll();
        setIsLoggedIn(false);
        setVtopFaculty([]);
        setSemesters([]);
        setSelectedSemester(null);
        setCurrentPage('dashboard');
        setActiveTab('HOME');
    };

    const handleToggleNotify = async (cabinId, isAutoClear = false) => {
        const isCurrentlyQueued = mySubs.includes(cabinId);

        if (!isCurrentlyQueued && !isAutoClear) {
            // Subscribe
            setMySubs(prev => {
                const updated = [...prev, cabinId];
                storage.saveData('my_notifications_subs', updated);
                return updated;
            });
            await subscribeToFaculty(cabinId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (isCurrentlyQueued) {
            // Unsubscribe
            setMySubs(prev => {
                const updated = prev.filter(id => id !== cabinId);
                storage.saveData('my_notifications_subs', updated);
                return updated;
            });
            await unsubscribeFromFaculty(cabinId);
            if (!isAutoClear) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const filteredFaculty = useMemo(() => {
        let items = [];
        if (activeTab === 'HOME') {
            items = Object.entries(config).map(([id, name]) => ({
                cabinId: id,
                name,
                data: faculty[id],
                count: subsCount[id] || 0
            }));
        } else {
            items = vtopFaculty.map(vf => ({
                cabinId: vf.cabinId,
                name: vf.name,
                data: faculty[vf.cabinId],
                count: subsCount[vf.cabinId] || 0
            }));
        }

        return items.filter(item => {
            const matchesSearch = (item.name + item.cabinId).toLowerCase().includes(search.toLowerCase());
            const matchesFilter = statusFilter === 'ALL' || (item.data?.status || 'UNKNOWN') === statusFilter;
            return matchesSearch && matchesFilter;
        });
    }, [faculty, config, subsCount, activeTab, statusFilter, search, vtopFaculty]);

    // Split into pages of 4
    const pages = useMemo(() => {
        const p = [];
        for (let i = 0; i < filteredFaculty.length; i += 4) {
            p.push(filteredFaculty.slice(i, i + 4));
        }
        return p;
    }, [filteredFaculty]);

    const filterItems = [
        { id: 'ALL', label: 'All', icon: LayoutGrid, color: COLORS.foregroundMuted },
        { id: 'AVAILABLE', label: 'Available', icon: CheckCircle2, color: COLORS.success },
        { id: 'BUSY', label: 'Busy', icon: MinusCircle, color: COLORS.destructive },
        { id: 'UNKNOWN', label: 'Unknown', icon: HelpCircle, color: COLORS.mutedForeground }
    ];

    // ============================================
    // DASHBOARD RENDER
    // ============================================
    const renderDashboard = () => (
        <View style={styles.dashboard}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerLogo}>Faculty<Text style={styles.headerLogoSub}>HUB</Text></Text>
                        <View style={styles.headerLive}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE STATUS</Text>
                        </View>
                    </View>

                    {/* Tab Toggle */}
                    <View style={styles.tabToggle}>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'HOME' && styles.tabBtnActive]}
                            onPress={() => { setActiveTab('HOME'); Haptics.selectionAsync(); }}
                        >
                            <Text style={[styles.tabBtnText, activeTab === 'HOME' && styles.tabBtnTextActive]}>HOME</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'MY' && styles.tabBtnActive]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                if (!isLoggedIn) setShowLogin(true);
                                else setActiveTab('MY');
                            }}
                        >
                            <Text style={[styles.tabBtnText, activeTab === 'MY' && styles.tabBtnTextActive]}>MY FACULTY</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={16} color={COLORS.mutedForeground} />
                        <TextInput
                            placeholder="Search all faculty..."
                            placeholderTextColor={COLORS.mutedForeground}
                            style={styles.searchInput}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* Filter Pills */}
                <View style={styles.filterContainer}>
                    {filterItems.map((f) => (
                        <FilterPill
                            key={f.id}
                            item={f}
                            isActive={statusFilter === f.id}
                            onPress={() => { setStatusFilter(f.id); Haptics.selectionAsync(); }}
                        />
                    ))}
                </View>
            </View>

            {/* Main Grid */}
            <View style={styles.main}>
                {pages.length > 0 ? (
                    <FlatList
                        ref={scrollRef}
                        data={pages}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => setPageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                        renderItem={({ item: pageItems }) => (
                            <View style={styles.pageContainer}>
                                <View style={styles.grid}>
                                    {pageItems.map((f) => (
                                        <FacultyCard
                                            key={f.cabinId}
                                            {...f}
                                            isQueued={mySubs.includes(f.cabinId)}
                                            onToggleNotify={handleToggleNotify}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                        keyExtractor={(_, i) => i.toString()}
                    />
                ) : (
                    <View style={styles.empty}>
                        <Search size={32} color={COLORS.border} />
                        <Text style={styles.emptyText}>NO MATCHES FOUND</Text>
                    </View>
                )}
            </View>

            {/* Pagination */}
            {pages.length > 1 && (
                <View style={styles.pagination}>
                    <TouchableOpacity
                        onPress={() => {
                            scrollRef.current?.scrollToIndex({ index: Math.max(0, pageIndex - 1) });
                            Haptics.selectionAsync();
                        }}
                        disabled={pageIndex === 0}
                    >
                        <ChevronLeft size={20} color={pageIndex === 0 ? COLORS.border : COLORS.foregroundMuted} />
                    </TouchableOpacity>
                    <View style={styles.dots}>
                        {pages.map((_, i) => (
                            <View key={i} style={[styles.dot, pageIndex === i && styles.dotActive]} />
                        ))}
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            scrollRef.current?.scrollToIndex({ index: Math.min(pages.length - 1, pageIndex + 1) });
                            Haptics.selectionAsync();
                        }}
                        disabled={pageIndex === pages.length - 1}
                    >
                        <ChevronRight size={20} color={pageIndex === pages.length - 1 ? COLORS.border : COLORS.foregroundMuted} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    // ============================================
    // PROFILE RENDER
    // ============================================
    const renderProfile = () => (
        <View style={styles.profile}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

            <View style={styles.profileHeader}>
                <TouchableOpacity onPress={() => { setCurrentPage('dashboard'); Haptics.selectionAsync(); }}>
                    <ArrowLeft size={24} color={COLORS.foreground} />
                </TouchableOpacity>
                <View style={styles.profileHeaderTitle}>
                    <Text style={styles.profileTitle}>Profile <Text style={styles.profileTitleSub}>Settings</Text></Text>
                    <Text style={styles.profileSub}>MANAGE YOUR VTOP SESSION</Text>
                </View>
            </View>

            <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
                {/* User Card */}
                <View style={styles.profileUserCard}>
                    <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.profileAvatar}>
                        <UserIcon size={28} color="#FFF" />
                    </LinearGradient>
                    <View>
                        <Text style={styles.profileHi}>Hi {credentials?.username?.toUpperCase() || 'Student'}! 👋</Text>
                        <Text style={styles.profileStatus}>Connected & Active</Text>
                    </View>
                </View>

                {/* Semester Selection */}
                <View style={styles.profileSection}>
                    <View style={styles.sectionHead}>
                        <GraduationCap size={18} color="#3B82F6" />
                        <Text style={styles.sectionTitle}>Semester Selection</Text>
                    </View>
                    <Text style={styles.sectionDesc}>Choose a semester to view its faculty timetable</Text>
                    <TouchableOpacity
                        style={styles.semesterBtn}
                        activeOpacity={0.9}
                        onPress={() => isLoggedIn && semesters.length > 0 && setShowSemesterPicker(true)}
                    >
                        <LinearGradient colors={['#3B82F6', '#8B5CF6']} start={[0, 0]} end={[1, 0]} style={styles.semesterBtnInner}>
                            <View style={styles.semIcon}>
                                <GraduationCap size={20} color="#FFF" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                {isSwitchingSemester ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.semBtnText}>
                                            {selectedSemester ? selectedSemester.name : 'Select Semester'}
                                        </Text>
                                        <Text style={styles.semBtnSub}>
                                            {semesters.length > 0 ? `${semesters.length} available` : 'Not logged in'}
                                        </Text>
                                    </>
                                )}
                            </View>
                            <ChevronRight size={18} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Session Management */}
                <View style={styles.profileSection}>
                    <Text style={styles.sectionTitleBlack}>Session Management</Text>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.9}>
                        <View style={styles.logoutIcon}>
                            <LogOut size={20} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.logoutText}>Logout from VTOP</Text>
                            <Text style={styles.logoutSub}>Clear all session data and credentials</Text>
                        </View>
                        <ChevronRight size={18} color="#FCA5A5" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                    {currentPage === 'dashboard' ? renderDashboard() : renderProfile()}

                    {/* Bottom Navigation */}
                    <View style={styles.bottomNavWrapper}>
                        <View style={styles.bottomNav}>
                            <TouchableOpacity
                                style={styles.navItem}
                                onPress={() => { setCurrentPage('dashboard'); Haptics.selectionAsync(); }}
                            >
                                <LayoutGrid size={18} color={currentPage === 'dashboard' ? "#FFF" : COLORS.mutedForeground} />
                                <Text style={[styles.navText, currentPage === 'dashboard' && styles.navTextActive]}>HOME</Text>
                            </TouchableOpacity>
                            <View style={styles.navDivider} />
                            <TouchableOpacity
                                style={styles.navItem}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    if (!isLoggedIn) setShowLogin(true);
                                    else setCurrentPage('profile');
                                }}
                            >
                                {isLoggedIn ? (
                                    <>
                                        <UserCircle size={18} color={currentPage === 'profile' ? "#FFF" : COLORS.mutedForeground} />
                                        <Text style={[styles.navText, currentPage === 'profile' && styles.navTextActive]}>ME</Text>
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={18} color={COLORS.mutedForeground} />
                                        <Text style={styles.navText}>LOGIN</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Semester Picker Modal */}
                    <Modal visible={showSemesterPicker} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.loginCard, { paddingBottom: 15 }]}>
                                <View style={[styles.sectionHead, { marginBottom: 15, paddingHorizontal: 5 }]}>
                                    <GraduationCap size={18} color="#3B82F6" />
                                    <Text style={styles.sectionTitle}>Available Semesters</Text>
                                </View>
                                <ScrollView style={{ maxHeight: height * 0.4 }}>
                                    {semesters.map((sem) => (
                                        <TouchableOpacity
                                            key={sem.id}
                                            style={[
                                                styles.semesterItem,
                                                selectedSemester?.id === sem.id && styles.semesterItemActive
                                            ]}
                                            onPress={() => handleSemesterChange(sem)}
                                        >
                                            <Text style={[
                                                styles.semesterItemText,
                                                selectedSemester?.id === sem.id && styles.semesterItemTextActive
                                            ]}>
                                                {sem.name}
                                            </Text>
                                            {selectedSemester?.id === sem.id && (
                                                <CheckCircle2 size={18} color="#3B82F6" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity
                                    style={[styles.loginCancel, { marginTop: 15, width: '100%' }]}
                                    onPress={() => setShowSemesterPicker(false)}
                                >
                                    <Text style={styles.loginCancelText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Login Modal */}
                    <Modal visible={showLogin} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <TouchableOpacity
                                style={styles.modalClose}
                                onPress={() => setShowLogin(false)}
                                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                            >
                                <X color="#FFF" size={28} />
                            </TouchableOpacity>

                            <View style={styles.modalBody}>
                                <Animated.View style={[
                                    styles.pandaWrapper,
                                    { transform: [{ scale: pandaScale }, { translateY: shiftY }] }
                                ]}>
                                    <PandaMascot
                                        isTypingUsername={username.length > 0}
                                        isTypingPassword={password.length > 0}
                                    />

                                    <View style={styles.loginCard}>
                                        <PandaHands isTypingPassword={password.length > 0} />
                                        <PandaPaws />
                                        <Text style={styles.loginTitle}>Login to VTOP</Text>
                                        <Text style={styles.loginDesc}>Your credentials are used only to fetch your faculty's snaphot.</Text>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>VTOP USERNAME</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="24MISXXXX"
                                                placeholderTextColor={COLORS.mutedForeground}
                                                value={username}
                                                onChangeText={setUsername}
                                                autoCapitalize="characters"
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>PASSWORD</Text>
                                            <View style={styles.passwordWrapper}>
                                                <TextInput
                                                    style={styles.passwordInput}
                                                    placeholder="Enter VTOP password"
                                                    placeholderTextColor={COLORS.mutedForeground}
                                                    secureTextEntry={!showPassword}
                                                    value={password}
                                                    onChangeText={setPassword}
                                                />
                                                <TouchableOpacity
                                                    onPress={() => setShowPassword(!showPassword)}
                                                    style={styles.eyeIcon}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff color={COLORS.mutedForeground} size={20} />
                                                    ) : (
                                                        <Eye color={COLORS.mutedForeground} size={20} />
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.loginActions}>
                                            <TouchableOpacity
                                                style={styles.loginCancel}
                                                onPress={() => setShowLogin(false)}
                                            >
                                                <Text style={styles.loginCancelText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.loginSubmit}
                                                onPress={handleLogin}
                                                disabled={isLoggingIn}
                                            >
                                                {isLoggingIn ? (
                                                    <ActivityIndicator color="#FFF" />
                                                ) : (
                                                    <Text style={styles.loginSubmitText}>Login</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Animated.View>
                            </View>
                        </View>
                    </Modal>
                </SafeAreaView>
            </View>
        </SafeAreaProvider>
    );
}

// ============================================
// STYLES - Light Theme
// ============================================
const em = (val) => val * 14;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    // Dashboard
    dashboard: {
        flex: 1,
    },

    // Header
    header: {
        backgroundColor: COLORS.card,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLogo: {
        fontSize: 26,
        fontWeight: '900',
        color: COLORS.foreground,
        letterSpacing: -1,
    },
    headerLogoSub: {
        color: '#94A3B8',
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerLive: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#22C55E',
        marginRight: 5,
    },
    liveText: {
        fontSize: 8,
        fontWeight: '800',
        color: COLORS.mutedForeground,
        letterSpacing: 1,
    },

    // Tab Toggle
    tabToggle: {
        flexDirection: 'row',
        backgroundColor: COLORS.secondary,
        borderRadius: 10,
        padding: 2,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    tabBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tabBtnActive: {
        backgroundColor: COLORS.primary,
    },
    tabBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.foregroundMuted,
    },
    tabBtnTextActive: {
        color: '#FFF',
        fontWeight: '900',
    },

    // Search
    searchContainer: {
        marginTop: 15,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        height: 44,
        paddingHorizontal: 14,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.foreground,
    },

    // Filters
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 34,
        paddingHorizontal: 10,
        borderRadius: 17,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterPillActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.sm,
    },
    filterPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1E293B',
        marginLeft: 4,
    },
    filterPillTextActive: {
        color: '#FFF',
    },

    // Main Grid
    main: {
        flex: 1,
        marginTop: 10,
    },
    pageContainer: {
        width: width,
        paddingHorizontal: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    // Card
    card: {
        width: (width - 50) / 2,
        aspectRatio: 1,
        borderRadius: 18,
        padding: 10,
        borderWidth: 1,
        marginBottom: 8,
        justifyContent: 'space-between',
        ...SHADOWS.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardAvatar: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    // Badge
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    // Card Body
    cardBody: {
        marginTop: 6,
    },
    cardName: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.foreground,
        lineHeight: 16,
        minHeight: 32,
    },
    cardLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    cardLocationText: {
        fontSize: 10,
        color: COLORS.mutedForeground,
        marginLeft: 4,
        fontWeight: '700',
    },

    // Card Stats
    cardStats: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 6,
    },
    statItem: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 8,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 7,
        fontWeight: '800',
        color: COLORS.mutedForeground,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 11,
        fontWeight: '900',
        color: COLORS.foreground,
    },

    // Card Action
    cardActionBtn: {
        backgroundColor: COLORS.primary,
        height: 32,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    cardActionBtnText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 6,
        letterSpacing: 0.2,
    },
    cardActionBtnQueued: {
        backgroundColor: COLORS.secondary,
        borderWidth: 1,
        borderColor: COLORS.muted,
    },
    cardActionBtnTextQueued: {
        color: COLORS.mutedForeground,
    },
    cardAvailableTag: {
        backgroundColor: COLORS.successLight,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.successBorder,
        marginTop: 4,
    },
    cardAvailableTagText: {
        color: COLORS.success,
        fontSize: 10,
        fontWeight: '800',
    },

    // Empty State
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.border,
        letterSpacing: 1,
    },

    // Pagination
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        marginBottom: 75,
    },
    dots: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.border,
        marginHorizontal: 4,
    },
    dotActive: {
        width: 22,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },

    // Bottom Nav
    bottomNavWrapper: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    bottomNav: {
        flexDirection: 'row',
        width: 220,
        height: 54,
        backgroundColor: '#000000',
        borderRadius: 16,
        alignItems: 'center',
        paddingHorizontal: 20,
        ...SHADOWS.lg,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
    },
    navDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    navText: {
        fontSize: 8,
        fontWeight: '900',
        color: COLORS.mutedForeground,
        marginTop: 4,
    },
    navTextActive: {
        color: '#FFF',
    },

    // Profile Page
    profile: {
        flex: 1,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        backgroundColor: COLORS.card,
    },
    profileHeaderTitle: {
        marginLeft: 15,
    },
    profileTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.foreground,
    },
    profileTitleSub: {
        color: COLORS.mutedForeground,
    },
    profileSub: {
        fontSize: 8,
        fontWeight: '800',
        color: COLORS.mutedForeground,
        letterSpacing: 1,
    },
    profileContent: {
        flex: 1,
        padding: 20,
    },
    profileUserCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 15,
        borderRadius: 18,
        ...SHADOWS.md,
    },
    profileAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    profileHi: {
        fontSize: 16,
        fontWeight: '900',
        color: COLORS.foreground,
    },
    profileStatus: {
        fontSize: 11,
        color: COLORS.foregroundMuted,
        marginTop: 2,
    },
    profileSection: {
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 20,
        marginTop: 20,
        ...SHADOWS.sm,
    },
    sectionHead: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.foreground,
        marginLeft: 8,
    },
    sectionTitleBlack: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.foreground,
        marginBottom: 15,
    },
    sectionDesc: {
        fontSize: 11,
        color: COLORS.foregroundMuted,
        marginBottom: 20,
    },
    semesterBtn: {
        height: 70,
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    semesterBtnInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    semIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    semBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '900',
    },
    semBtnSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#B91C1C',
    },
    logoutSub: {
        fontSize: 10,
        color: '#EF4444',
        opacity: 0.8,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalClose: {
        position: 'absolute',
        top: 50,
        right: 30,
        zIndex: 99, // Ensure it stays on top
    },
    modalBody: {
        width: '100%',
        alignItems: 'center',
    },
    pandaWrapper: {
        width: '100%',
        alignItems: 'center',
        paddingTop: em(3.1),
        position: 'relative',
    },
    loginCard: {
        width: '92%',
        backgroundColor: COLORS.card,
        borderRadius: 25,
        padding: 25,
        ...SHADOWS.lg,
        position: 'relative',
        zIndex: 5,
    },
    loginTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.foreground,
        textAlign: 'center',
    },
    loginDesc: {
        fontSize: 11,
        color: COLORS.foregroundMuted,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 25,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: COLORS.mutedForeground,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 15,
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.foreground,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    passwordWrapper: {
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        overflow: 'hidden',
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 15,
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.foreground,
    },
    eyeIcon: {
        paddingHorizontal: 15,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    loginCancel: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    loginCancelText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.foregroundMuted,
    },
    loginSubmit: {
        flex: 1.5,
        height: 48,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        ...SHADOWS.md,
    },
    loginSubmitText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFF',
    },
    semesterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: COLORS.secondary,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    semesterItemActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderColor: '#3B82F6',
    },
    semesterItemText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.foreground,
        flex: 1,
        marginRight: 10,
    },
    semesterItemTextActive: {
        color: '#3B82F6',
        fontWeight: '700',
    },
});
