// Дополнительная логика для Telegram Mini App
class TelegramIntegration {
    constructor() {
        this.initTelegram();
    }

    initTelegram() {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            // Инициализация Telegram Web App
            Telegram.WebApp.ready();
            
            // Установка темы
            this.setTheme();
            
            // Обработка изменения темы
            Telegram.WebApp.onEvent('themeChanged', this.setTheme);
            
            // Настройка кнопки Main Button
            this.setupMainButton();
            
            // Загрузка данных пользователя
            this.loadUserData();
        }
    }

    setTheme() {
        const theme = Telegram.WebApp.colorScheme;
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'dark') {
            document.body.style.backgroundColor = '#121212';
            document.body.style.color = '#ffffff';
        } else {
            document.body.style.backgroundColor = '#ffffff';
            document.body.style.color = '#2b2d42';
        }
    }

    setupMainButton() {
        // Можно добавить главную кнопку Telegram
        // Telegram.WebApp.MainButton.setText('Оформить заказ');
        // Telegram.WebApp.MainButton.onClick(() => {
        //     document.querySelector('.btn-primary').click();
        // });
    }

    loadUserData() {
        if (Telegram.WebApp.initDataUnsafe.user) {
            const user = Telegram.WebApp.initDataUnsafe.user;
            
            // Можно сохранить данные пользователя
            localStorage.setItem('tg_user', JSON.stringify({
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                languageCode: user.language_code
            }));
        }
    }

    sendDataToBot(data) {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.sendData(JSON.stringify(data));
        }
    }

    closeApp() {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.close();
        }
    }
}

// Инициализация Telegram интеграции
document.addEventListener('DOMContentLoaded', () => {
    window.telegramIntegration = new TelegramIntegration();
    
    // Добавление анимаций при загрузке
    document.querySelectorAll('.service-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in-up');
    });
});

// CSS анимации
const style = document.createElement('style');
style.textContent = `
    .fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
        opacity: 0;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .pulse {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
    
    .shake {
        animation: shake 0.5s;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);