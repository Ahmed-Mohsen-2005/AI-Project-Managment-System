# i18n.py
from flask import session

translations = {
    'en': {
        # ===== NAVIGATION & COMMON =====
        'aipms': 'AIPMS',
        'ai_project_management': 'AI Project Management System',
        'home': 'Home',
        'boards': 'Boards',
        'dashboard': 'Dashboard',
        'task_board': 'Task Board',
        'sprints': 'Sprints',
        'backlog': 'Backlog',
        'reports': 'Reports',
        'chats': 'Chats',
        'repos': 'Repos',
        'settings': 'Settings',
        'profile': 'Profile',
        'logout': 'Logout',
        'search_placeholder': 'Search tasks, projects, or users (Ctrl+K)...',
        'add_new': 'Add New',
        'notifications': 'Notifications',
        
        # ===== LOGIN/SIGNUP PAGE =====
        'log_in': 'Log In',
        'sign_up': 'Sign Up',
        'username_or_email': 'Username or Email',
        'password': 'Password',
        'remember_me': 'Remember Me',
        'forgot_password': 'Forgot Password?',
        'secure_login': 'Secure Log In',
        'or': 'or',
        'create_account': 'Create AIPMS Account',
        'email_address': 'Email Address',
        'full_name': 'Full Name',
        'min_8_chars': 'Min 8 chars',
        'terms_of_service': 'Terms of Service',
        'agree_terms': 'By signing up, you agree to the',
        
        # ===== SETTINGS PAGE =====
        'settings_title': 'Settings',
        'general': 'General',
        'security': 'Security',
        'integrations': 'Integrations',
        'ai_governance': 'AI Governance',
        
        # General Tab
        'general_app_settings': 'General Application Settings',
        'display_preferences': 'Display Preferences',
        'language': 'Language',
        'account_actions': 'Account Actions',
        'current_email': 'Current Email',
        'update_profile': 'Update Profile',
        'delete_account': 'Delete Account',
        
        # Security Tab
        'security_role_mgmt': 'Security & Role Management (Admin Only)',
        'authentication': 'Authentication',
        'two_factor_auth': 'Two-Factor Authentication (2FA)',
        'rbac': 'Role-Based Access Control (FR-201)',
        'manage_user_permissions': 'Manage User Permissions',
        'current_role': 'Current Role',
        'permission': 'Permission',
        'status': 'Status',
        'manage_budget': 'Manage Budget (FR-403)',
        'create_projects': 'Create Projects (FR-101)',
        'save_permissions': 'Save Permissions',
        
        # Integrations Tab
        'external_tools': 'External Tool Connections',
        'connected': 'Connected',
        'disconnected': 'Disconnected',
        'disconnect': 'Disconnect',
        'connect': 'Connect',
        
        # AI Governance Tab
        'ai_model_governance': 'AI Model & Governance (FR-508)',
        'model_information': 'Model Information',
        'active_model_version': 'Active Model Version',
        'last_training_date': 'Last Training Date',
        'ai_feature_controls': 'AI Feature Controls',
        'enable_predictive_risk': 'Enable Predictive Risk Scores (FR-203)',
        'enable_sentiment_analysis': 'Enable Sentiment Analysis (FR-503)',
        'audit_compliance': 'Audit & Compliance (FR-508)',
        'ai_decisions_logged': 'All AI decisions and model updates are logged and traceable.',
        'export_audit_log': 'Export AI Audit Log',
        
        # Notifications Tab
        'notification_channels': 'Notification Channels',
        'email_preferences': 'Email Preferences',
        'receive_email_alerts': 'Receive Email Alerts for P1 Tasks',
        'slack_configuration': 'Slack Configuration (Linked via Integration)',
        'alerts_sent_to': 'Alerts are currently sent to',
        'receive_swarm_alerts': 'Receive Alerts for Swarm Assignment (FR-202)',
        
        # ===== HOME PAGE / DASHBOARD =====
        'calendar': 'Calendar',
        'next_deadline': 'Next Deadline',
        'todo_list': 'To-do List',
        'add_task': 'Add Task',
        'notes': 'Notes',
        'team_tracker': 'Team Tracker',
        'summarize_updates': 'Summarize project updates...',
        'generate_summary': 'Generate Summary',
        'time_tracker': 'Time Tracker',
        'team': 'Team',
        'all_tasks': 'All Tasks',
        'task_name': 'Task Name',
        'assigned_to': 'Assigned To',
        'priority': 'Priority',
        'due_date': 'Due Date',
        'loading': 'Loading...',
        
        # ===== BOARDS PAGE =====
        'task_board': 'Task Board',
        'add_new_task': 'Add New Task',
        'todo': 'To Do',
        'in_progress': 'In Progress',
        'done': 'Done',
        'backlog_items': 'Backlog Items',
        'sprint_planning': 'Sprint Planning',
        'active_sprint': 'Active Sprint',
        'sprint_tasks': 'Sprint Tasks',
        
        # ===== REPORTS PAGE =====
        'reports': 'Reports',
        'project_summary': 'Project Summary',
        'team_performance': 'Team Performance',
        'task_completion': 'Task Completion',
        'velocity_chart': 'Velocity Chart',
        'export_report': 'Export Report',
        
        # ===== REPOSITORIES PAGE =====
        'repositories': 'Repositories',
        'repository_name': 'Repository Name',
        'last_commit': 'Last Commit',
        'branch': 'Branch',
        'clone': 'Clone',
        
        # ===== PROFILE PAGE =====
        'my_profile': 'My Profile',
        'user_information': 'User Information',
        'edit_profile': 'Edit Profile',
        'change_password': 'Change Password',
        'save_changes': 'Save Changes',
        'cancel': 'Cancel',
        
        # ===== BUTTONS & FORMS =====
        'save': 'Save',
        'submit': 'Submit',
        'delete': 'Delete',
        'edit': 'Edit',
        'close': 'Close',
        'confirm': 'Confirm',
        'back': 'Back',
        'next': 'Next',
        'previous': 'Previous',
        'yes': 'Yes',
        'no': 'No',
        'error': 'Error',
        'success': 'Success',
        'warning': 'Warning',
        'info': 'Info',
        'required_field': 'This field is required',
        'confirm_logout_message': 'Are you sure you want to end your session and log out of AIPMS?',
    },
    'ar': {
        # ===== NAVIGATION & COMMON =====
        'aipms': 'نظام إدارة المشاريع بالذكاء الاصطناعي',
        'ai_project_management': 'نظام إدارة المشاريع المتقدم بالذكاء الاصطناعي',
        'home': 'الرئيسية',
        'boards': 'اللوحات',
        'dashboard': 'لوحة التحكم',
        'task_board': 'لوحة المهام',
        'sprints': 'الدورات',
        'backlog': 'السجل المتراجع',
        'reports': 'التقارير',
        'chats': 'الدردشات',
        'repos': 'المستودعات',
        'settings': 'الإعدادات',
        'profile': 'الملف الشخصي',
        'logout': 'تسجيل الخروج',
        'search_placeholder': 'البحث في المهام أو المشاريع أو المستخدمين (Ctrl+K)...',
        'add_new': 'إضافة جديد',
        'notifications': 'الإشعارات',
        
        # ===== LOGIN/SIGNUP PAGE =====
        'log_in': 'تسجيل الدخول',
        'sign_up': 'إنشاء حساب',
        'username_or_email': 'اسم المستخدم أو البريد الإلكتروني',
        'password': 'كلمة المرور',
        'remember_me': 'تذكرني',
        'forgot_password': 'هل نسيت كلمة المرور؟',
        'secure_login': 'تسجيل دخول آمن',
        'or': 'أو',
        'create_account': 'إنشاء حساب AIPMS',
        'email_address': 'عنوان البريد الإلكتروني',
        'full_name': 'الاسم الكامل',
        'min_8_chars': 'الحد الأدنى 8 أحرف',
        'terms_of_service': 'شروط الخدمة',
        'agree_terms': 'بالتسجيل، فإنك توافق على',
        
        # ===== SETTINGS PAGE =====
        'settings_title': 'الإعدادات',
        'general': 'عام',
        'security': 'الأمان',
        'integrations': 'التكاملات',
        'ai_governance': 'حوكمة الذكاء الاصطناعي',
        
        # General Tab
        'general_app_settings': 'إعدادات التطبيق العامة',
        'display_preferences': 'تفضيلات العرض',
        'language': 'اللغة',
        'account_actions': 'إجراءات الحساب',
        'current_email': 'البريد الإلكتروني الحالي',
        'update_profile': 'تحديث الملف الشخصي',
        'delete_account': 'حذف الحساب',
        
        # Security Tab
        'security_role_mgmt': 'الأمان وإدارة الأدوار (للمسؤولين فقط)',
        'authentication': 'المصادقة',
        'two_factor_auth': 'المصادقة الثنائية (2FA)',
        'rbac': 'التحكم في الوصول القائم على الأدوار (FR-201)',
        'manage_user_permissions': 'إدارة أذونات المستخدم',
        'current_role': 'الدور الحالي',
        'permission': 'الإذن',
        'status': 'الحالة',
        'manage_budget': 'إدارة الميزانية (FR-403)',
        'create_projects': 'إنشاء المشاريع (FR-101)',
        'save_permissions': 'حفظ الأذونات',
        
        # Integrations Tab
        'external_tools': 'اتصالات الأدوات الخارجية',
        'connected': 'متصل',
        'disconnected': 'غير متصل',
        'disconnect': 'قطع الاتصال',
        'connect': 'اتصال',
        
        # AI Governance Tab
        'ai_model_governance': 'نموذج الذكاء الاصطناعي والحوكمة (FR-508)',
        'model_information': 'معلومات النموذج',
        'active_model_version': 'إصدار النموذج النشط',
        'last_training_date': 'تاريخ آخر تدريب',
        'ai_feature_controls': 'ضوابط ميزات الذكاء الاصطناعي',
        'enable_predictive_risk': 'تفعيل درجات المخاطر التنبؤية (FR-203)',
        'enable_sentiment_analysis': 'تفعيل تحليل المشاعر (FR-503)',
        'audit_compliance': 'التدقيق والامتثال (FR-508)',
        'ai_decisions_logged': 'يتم تسجيل جميع قرارات الذكاء الاصطناعي وتحديثات النموذج وتتبعها.',
        'export_audit_log': 'تصدير سجل تدقيق الذكاء الاصطناعي',
        
        # Notifications Tab
        'notification_channels': 'قنوات الإشعارات',
        'email_preferences': 'تفضيلات البريد الإلكتروني',
        'receive_email_alerts': 'تلقي تنبيهات البريد الإلكتروني لمهام P1',
        'slack_configuration': 'تكوين Slack (مرتبط عبر التكامل)',
        'alerts_sent_to': 'يتم إرسال التنبيهات حاليًا إلى',
        'receive_swarm_alerts': 'تلقي التنبيهات لتعيين السرب (FR-202)',
        
        # ===== HOME PAGE / DASHBOARD =====
        'calendar': 'التقويم',
        'next_deadline': 'الموعد النهائي التالي',
        'todo_list': 'قائمة المهام',
        'add_task': 'إضافة مهمة',
        'notes': 'الملاحظات',
        'team_tracker': 'متتبع الفريق',
        'summarize_updates': 'تلخيص تحديثات المشروع...',
        'generate_summary': 'إنشاء ملخص',
        'time_tracker': 'متتبع الوقت',
        'team': 'الفريق',
        'all_tasks': 'جميع المهام',
        'task_name': 'اسم المهمة',
        'assigned_to': 'مسند إلى',
        'priority': 'الأولوية',
        'due_date': 'تاريخ الاستحقاق',
        'loading': 'جاري التحميل...',
        
        # ===== BOARDS PAGE =====
        'task_board': 'لوحة المهام',
        'add_new_task': 'إضافة مهمة جديدة',
        'todo': 'قيد الانتظار',
        'in_progress': 'جاري العمل',
        'done': 'تم',
        'backlog_items': 'عناصر السجل المتراجع',
        'sprint_planning': 'تخطيط الدورة',
        'active_sprint': 'الدورة النشطة',
        'sprint_tasks': 'مهام الدورة',
        
        # ===== REPORTS PAGE =====
        'reports': 'التقارير',
        'project_summary': 'ملخص المشروع',
        'team_performance': 'أداء الفريق',
        'task_completion': 'إكمال المهمة',
        'velocity_chart': 'مخطط السرعة',
        'export_report': 'تصدير التقرير',
        
        # ===== REPOSITORIES PAGE =====
        'repositories': 'المستودعات',
        'repository_name': 'اسم المستودع',
        'last_commit': 'آخر تزامن',
        'branch': 'الفرع',
        'clone': 'استنساخ',
        
        # ===== PROFILE PAGE =====
        'my_profile': 'ملفي الشخصي',
        'user_information': 'معلومات المستخدم',
        'edit_profile': 'تعديل الملف الشخصي',
        'change_password': 'تغيير كلمة المرور',
        'save_changes': 'حفظ التغييرات',
        'cancel': 'إلغاء',
        
        # ===== BUTTONS & FORMS =====
        'save': 'حفظ',
        'submit': 'إرسال',
        'delete': 'حذف',
        'edit': 'تعديل',
        'close': 'إغلاق',
        'confirm': 'تأكيد',
        'back': 'رجوع',
        'next': 'التالي',
        'previous': 'السابق',
        'yes': 'نعم',
        'no': 'لا',
        'error': 'خطأ',
        'success': 'نجح',
        'warning': 'تحذير',
        'info': 'معلومة',
        'required_field': 'هذا الحقل مطلوب',
        'confirm_logout_message': 'هل تريد بالفعل إنهاء جلستك وتسجيل الخروج من AIPMS؟',
    }
}

def get_locale():
    """Get current language from session or default to 'en'"""
    return session.get('language', 'en')

def get_translations():
    """Get translations for current language"""
    lang = get_locale()
    return translations.get(lang, translations['en'])

class TranslationProxy:
    """Allows access to translations using dot notation: t.settings_title"""
    def __init__(self, translations_dict):
        self._translations = translations_dict
    
    def __getattr__(self, key):
        return self._translations.get(key, key)
    
    def __getitem__(self, key):
        return self._translations.get(key, key)

def get_t():
    """Returns a translation proxy object for template use"""
    return TranslationProxy(get_translations())