class FrameSpiritApp {
    constructor() {
        this.currentService = null;
        this.selectedOptions = {};
        this.selectedTime = null;
        this.selectedDate = null;
        this.windowsVersion = null;
        this.userData = {};
        this.serviceDescriptions = {
            1: "Профессиональная сборка компьютера под ваши требования. Мы подберем оптимальные компоненты и соберем ПК с гарантией качества.",
            2: "Комплексное обслуживание и чистка системы. Вернем вашему компьютеру былую производительность.",
            3: "Модернизация и замена комплектующих. Улучшим производительность вашего ПК.",
            4: "Установка и настройка операционной системы. Быстро и качественно."
        };
        
        this.servicePrices = {
            1: {
                basic: { name: "Сборка ПК", price: 50, timeline: "1-3 дня" },
                windows: { name: "С установкой Windows", price: 70, timeline: "1-3 дня" },
                drivers: { name: "С установкой драйверов", price: 80, timeline: "1-3 дня" }
            },
            2: {
                cleaning: { name: "Чистка ПК от пыли", price: 50, timeline: "2-5 часов" },
                thermalpaste: { name: "С заменой термопасты CPU и GPU", price: 80, timeline: "3-6 часов" },
                thermalpads: { name: "С заменой термопрокладок GPU", price: "от 100 BYN", timeline: "4-8 часов", variable: true }
            },
            3: {
                single: { name: "Замена одной детали на месте", price: 30, timeline: "1-2 дня" }
            },
            4: {
                basic: { name: "Установка Windows", price: 45, timeline: "2-4 часа" },
                drivers: { name: "С установкой драйверов", price: 65, timeline: "2-4 часа" }
            }
        };
        
        this.initializeApp();
        this.bindEvents();
        this.loadUserData();
    }

    initializeApp() {
        console.log('Frame Spirit App Initialized');
        
        if (window.Telegram && Telegram.WebApp) {
            const user = Telegram.WebApp.initDataUnsafe.user;
            if (user) {
                const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь';
                document.getElementById('userName').textContent = userName;
                
                if (user.photo_url) {
                    document.getElementById('userAvatar').innerHTML = 
                        `<img src="${user.photo_url}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;">`;
                }
                
                this.userData.telegramId = user.id;
                this.userData.username = user.username;
            }
            
            Telegram.WebApp.expand();
            Telegram.WebApp.enableClosingConfirmation();
        }
        
        // Анимация появления карточек услуг
        setTimeout(() => {
            document.querySelectorAll('.service-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('fade-in-up');
            });
        }, 100);
    }

    bindEvents() {
        // Карточки услуг
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectService(e));
        });

        // Кнопки навигации
        document.getElementById('backButton').addEventListener('click', () => this.showServicesScreen());
        document.getElementById('backToServicesBtn').addEventListener('click', () => this.showServicesScreen());
        document.getElementById('backHomeBtn').addEventListener('click', () => this.showServicesScreen());

        // Выбор времени
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', (e) => this.selectTimeSlot(e));
        });

        // Выбор Windows
        document.querySelectorAll('.windows-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectWindowsVersion(e));
        });

        // Чекбокс установки драйверов для Windows
        document.getElementById('installDrivers')?.addEventListener('change', () => {
            this.updatePricing();
        });

        // Форма заказа
        document.getElementById('orderForm').addEventListener('submit', (e) => this.submitOrder(e));

        // Модальное окно
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('saveOptions').addEventListener('click', () => this.saveOptions());

        // Обработчики изменений в форме
        document.getElementById('appointmentDate').addEventListener('change', (e) => {
            this.selectedDate = e.target.value;
        });

        // Редактирование текстовых полей
        ['fullName', 'phone', 'address'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.userData[id] = e.target.value;
                });
            }
        });

        // Выбор первого временного слота по умолчанию
        const firstTimeSlot = document.querySelector('.time-slot');
        if (firstTimeSlot) {
            firstTimeSlot.classList.add('selected');
            this.selectedTime = firstTimeSlot.dataset.time;
        }
    }

    loadUserData() {
        const savedData = localStorage.getItem('frameSpiritUserData');
        if (savedData) {
            this.userData = { ...this.userData, ...JSON.parse(savedData) };
            
            // Заполнение полей формы сохраненными данными
            Object.keys(this.userData).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = this.userData[key];
                }
            });
        }
    }

    selectService(e) {
        const card = e.currentTarget;
        const serviceId = card.dataset.service;
        
        // Анимация нажатия
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);

        this.currentService = parseInt(serviceId);
        this.selectedOptions = {};
        this.windowsVersion = null;

        this.showOrderScreen();
        this.updateServiceDetails();
        this.updateDynamicFields();
        this.updatePricing();
    }

    showOrderScreen() {
        document.getElementById('servicesScreen').style.display = 'none';
        document.getElementById('orderScreen').style.display = 'block';
        document.getElementById('successScreen').style.display = 'none';
    }

    showServicesScreen() {
        document.getElementById('servicesScreen').style.display = 'block';
        document.getElementById('orderScreen').style.display = 'none';
        document.getElementById('successScreen').style.display = 'none';
    }

    showSuccessScreen() {
        document.getElementById('servicesScreen').style.display = 'none';
        document.getElementById('orderScreen').style.display = 'none';
        document.getElementById('successScreen').style.display = 'flex';
    }

    updateServiceDetails() {
        const serviceNames = {
            1: 'Сборка ПК',
            2: 'Чистка и обслуживание',
            3: 'Апгрейд ПК',
            4: 'Установка Windows'
        };

        document.getElementById('selectedServiceText').textContent = serviceNames[this.currentService];
        document.getElementById('orderScreenTitle').textContent = serviceNames[this.currentService];

        // Показ/скрытие опций Windows
        const windowsOptions = document.getElementById('windowsOptions');
        windowsOptions.style.display = this.currentService === 4 ? 'block' : 'none';
    }

    updateDynamicFields() {
        const dynamicFields = document.getElementById('dynamicFields');
        
        switch(this.currentService) {
            case 1:
                dynamicFields.innerHTML = `
                    <label for="pcDescription">Описание сборки</label>
                    <textarea id="pcDescription" required placeholder="Пример: Игровой ПК на базе Intel Core i7, RTX 4070, 32GB RAM, SSD 1TB, без операционной системы"></textarea>
                    <button type="button" class="btn-secondary" id="selectOptionsBtn" style="margin-top: 10px;">
                        <i class="fas fa-cog"></i> Выбрать дополнительные опции
                    </button>
                `;
                
                // Привязка события после добавления кнопки в DOM
                setTimeout(() => {
                    document.getElementById('selectOptionsBtn').addEventListener('click', () => this.showAssemblyOptionsModal());
                }, 100);
                break;
                
            case 2:
                dynamicFields.innerHTML = `
                    <label for="cleaningDescription">Описание проблемы</label>
                    <textarea id="cleaningDescription" required placeholder="Опишите состояние компьютера: шумит ли кулер, перегревается ли система, когда последний раз чистили и т.д."></textarea>
                    <button type="button" class="btn-secondary" id="selectCleaningOptionsBtn" style="margin-top: 10px;">
                        <i class="fas fa-broom"></i> Выбрать тип чистки
                    </button>
                `;
                
                setTimeout(() => {
                    document.getElementById('selectCleaningOptionsBtn').addEventListener('click', () => this.showCleaningOptionsModal());
                }, 100);
                break;
                
            case 3:
                dynamicFields.innerHTML = `
                    <label for="upgradeDescription">Какие детали нужно заменить/добавить</label>
                    <textarea id="upgradeDescription" required placeholder="Пример: Заменить видеокарту на RTX 4070, добавить 16GB RAM, установить дополнительный SSD 1TB"></textarea>
                `;
                break;
                
            case 4:
                dynamicFields.innerHTML = `
                    <label for="windowsDescription">Особые требования к установке</label>
                    <textarea id="windowsDescription" placeholder="Пример: Сохранение данных на диске D, установка необходимых программ, настройка специфичного ПО"></textarea>
                `;
                break;
        }
    }

    showAssemblyOptionsModal() {
        const options = [
            { 
                id: 'basic', 
                name: 'Сборка ПК', 
                description: 'Профессиональная сборка компьютера с тестированием всех компонентов',
                price: 50,
                timeline: '1-3 дня',
                selected: true 
            },
            { 
                id: 'windows', 
                name: 'С установкой Windows', 
                description: 'Сборка компьютера с установкой и настройкой Windows',
                price: 70,
                timeline: '1-3 дня'
            },
            { 
                id: 'drivers', 
                name: 'С установкой драйверов', 
                description: 'Сборка компьютера с установкой Windows и всех драйверов',
                price: 80,
                timeline: '1-3 дня'
            }
        ];

        this.showModal('Выберите опцию сборки', options);
    }

    showCleaningOptionsModal() {
        const options = [
            { 
                id: 'cleaning', 
                name: 'Чистка ПК от пыли', 
                description: 'Полная чистка системы охлаждения и компонентов от пыли',
                price: 50,
                timeline: '2-5 часов',
                selected: true 
            },
            { 
                id: 'thermalpaste', 
                name: 'С заменой термопасты', 
                description: 'Чистка с заменой термопасты на процессоре и видеокарте',
                price: 80,
                timeline: '3-6 часов'
            },
            { 
                id: 'thermalpads', 
                name: 'С заменой термопрокладок', 
                description: 'Замена термопрокладок на видеокарте (цена зависит от модели)',
                price: 'от 100 BYN',
                timeline: '4-8 часов',
                variable: true
            }
        ];

        this.showModal('Выберите тип обслуживания', options);
    }

    showModal(title, options) {
        document.getElementById('modalTitle').textContent = title;
        
        const modalOptions = document.getElementById('modalOptions');
        modalOptions.innerHTML = '';
        
        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = `option-item ${option.selected ? 'selected' : ''}`;
            optionElement.dataset.id = option.id;
            
            const checkmark = option.selected ? '<i class="fas fa-check option-checkmark"></i>' : '';
            
            optionElement.innerHTML = `
                <div class="option-info">
                    <div class="option-name">${option.name}</div>
                    <div class="option-description">${option.description}</div>
                    <div class="option-details">
                        <span class="option-price">${typeof option.price === 'number' ? `${option.price} BYN` : option.price}</span>
                        <span class="option-timeline"><i class="far fa-clock"></i> ${option.timeline}</span>
                    </div>
                </div>
                ${checkmark}
            `;
            
            optionElement.addEventListener('click', () => {
                // Снимаем выделение со всех опций
                modalOptions.querySelectorAll('.option-item').forEach(item => {
                    item.classList.remove('selected');
                    const checkmarkEl = item.querySelector('.option-checkmark');
                    if (checkmarkEl) checkmarkEl.remove();
                });
                
                // Выделяем выбранную опцию
                optionElement.classList.add('selected');
                optionElement.innerHTML = optionElement.innerHTML.replace('</div>', '<i class="fas fa-check option-checkmark"></i></div>');
                
                // Обновляем статус выбранности в массиве options
                options.forEach(opt => opt.selected = false);
                option.selected = true;
            });
            
            modalOptions.appendChild(optionElement);
        });
        
        this.modalOptions = options;
        document.getElementById('optionsModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('optionsModal').style.display = 'none';
    }

    saveOptions() {
        const selectedOption = this.modalOptions.find(opt => opt.selected);
        if (selectedOption) {
            this.selectedOptions = { [selectedOption.id]: selectedOption };
            this.updatePricing();
        }
        this.closeModal();
    }

    selectTimeSlot(e) {
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        e.currentTarget.classList.add('selected');
        this.selectedTime = e.currentTarget.dataset.time;
    }

    selectWindowsVersion(e) {
        document.querySelectorAll('.windows-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        e.currentTarget.classList.add('selected');
        this.windowsVersion = e.currentTarget.dataset.version;
        this.updatePricing();
    }

    calculatePrice() {
        let basePrice = 0;
        let variablePrice = false;
        
        switch(this.currentService) {
            case 1: // Сборка ПК
                if (Object.keys(this.selectedOptions).length > 0) {
                    const option = Object.values(this.selectedOptions)[0];
                    basePrice = typeof option.price === 'number' ? option.price : 0;
                    if (option.variable) variablePrice = true;
                } else {
                    basePrice = 50; // Базовая сборка по умолчанию
                }
                break;
                
            case 2: // Чистка и обслуживание
                if (Object.keys(this.selectedOptions).length > 0) {
                    const option = Object.values(this.selectedOptions)[0];
                    basePrice = typeof option.price === 'number' ? option.price : 0;
                    if (option.variable) variablePrice = true;
                } else {
                    basePrice = 50; // Базовая чистка по умолчанию
                }
                break;
                
            case 3: // Апгрейд ПК
                basePrice = 30; // Замена одной детали
                break;
                
            case 4: // Установка Windows
                const installDrivers = document.getElementById('installDrivers')?.checked;
                basePrice = installDrivers ? 65 : 45;
                break;
        }
        
        return { basePrice, variablePrice };
    }

    getTimeline() {
        const defaultTimelines = {
            1: '1-3 дня',
            2: '2-8 часов',
            3: '1-2 дня',
            4: '2-4 часа'
        };
        
        // Если выбрана опция, используем её timeline
        if (Object.keys(this.selectedOptions).length > 0) {
            const option = Object.values(this.selectedOptions)[0];
            return option.timeline || defaultTimelines[this.currentService];
        }
        
        return defaultTimelines[this.currentService] || '1-3 дня';
    }

    updatePricing() {
        const prices = this.calculatePrice();
        const timeline = this.getTimeline();
        const serviceName = document.getElementById('selectedServiceText').textContent;
        
        let optionsHTML = '';
        let priceDetailsHTML = '';
        
        // Генерация деталей цен в зависимости от услуги
        switch(this.currentService) {
            case 1:
                priceDetailsHTML = `
                    <div class="price-item">
                        <span>Сборка ПК</span>
                        <span>50 BYN</span>
                    </div>
                    <div class="price-item">
                        <span>С установкой Windows</span>
                        <span>70 BYN</span>
                    </div>
                    <div class="price-item">
                        <span>С установкой драйверов</span>
                        <span>80 BYN</span>
                    </div>
                `;
                break;
                
            case 2:
                priceDetailsHTML = `
                    <div class="price-item">
                        <span>Чистка ПК от пыли</span>
                        <span>50 BYN</span>
                    </div>
                    <div class="price-item">
                        <span>С заменой термопасты CPU и GPU</span>
                        <span>80 BYN</span>
                    </div>
                    <div class="price-item">
                        <span>С заменой термопрокладок GPU</span>
                        <span>от 100 BYN</span>
                    </div>
                `;
                break;
                
            case 3:
                priceDetailsHTML = `
                    <div class="price-item">
                        <span>Замена одной детали на месте</span>
                        <span>30 BYN</span>
                    </div>
                `;
                break;
                
            case 4:
                priceDetailsHTML = `
                    <div class="price-item">
                        <span>Установка/переустановка Windows</span>
                        <span>45 BYN</span>
                    </div>
                    <div class="price-item">
                        <span>С установкой драйверов</span>
                        <span>65 BYN</span>
                    </div>
                `;
                break;
        }
        
        // Выбранные опции
        if (Object.keys(this.selectedOptions).length > 0) {
            const option = Object.values(this.selectedOptions)[0];
            optionsHTML = `
                <div class="price-item">
                    <span>${option.name}</span>
                    <span>${typeof option.price === 'number' ? `${option.price} BYN` : option.price}</span>
                </div>
            `;
        } else if (this.currentService === 3) {
            // Для апгрейда показываем базовую цену
            optionsHTML = `
                <div class="price-item">
                    <span>Замена одной детали на месте</span>
                    <span>30 BYN</span>
                </div>
            `;
        }
        
        const pricingHTML = `
            <h3 style="margin-bottom: 15px; color: var(--dark-color);">Стоимость и сроки</h3>
            <div class="service-description-box">
                <p><strong>${serviceName}</strong></p>
                <p class="service-desc-text">${this.serviceDescriptions[this.currentService]}</p>
            </div>
            
            <div style="margin: 15px 0;">
                <h4 style="font-size: 14px; color: var(--gray-color); margin-bottom: 10px;">Доступные опции:</h4>
                ${priceDetailsHTML}
            </div>
            
            ${optionsHTML ? `
                <div style="margin: 15px 0;">
                    <h4 style="font-size: 14px; color: var(--gray-color); margin-bottom: 10px;">Вы выбрали:</h4>
                    ${optionsHTML}
                </div>
            ` : ''}
            
            ${this.currentService === 4 ? `
                <div class="windows-note">
                    <i class="fas fa-info-circle"></i> Цена не зависит от версии Windows (10 или 11)
                </div>
            ` : ''}
            
            <div class="price-total">
                <span>Итого</span>
                <span>${prices.variablePrice ? 'от ' : ''}${prices.basePrice} BYN</span>
            </div>
            <div class="timeline">
                <i class="far fa-clock"></i> Срок выполнения: ${timeline}
            </div>
        `;
        
        document.getElementById('pricingInfo').innerHTML = pricingHTML;
    }

    validateForm() {
        const requiredFields = ['fullName', 'phone', 'address'];
        
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                this.showError(`Пожалуйста, заполните поле "${field?.previousElementSibling?.textContent || fieldId}"`);
                field?.focus();
                return false;
            }
        }
        
        // Валидация специфичных полей
        if (this.currentService === 1 && !document.getElementById('pcDescription')?.value.trim()) {
            this.showError('Пожалуйста, опишите сборку ПК');
            return false;
        }
        
        if (this.currentService === 2 && !document.getElementById('cleaningDescription')?.value.trim()) {
            this.showError('Пожалуйста, опишите состояние компьютера');
            return false;
        }
        
        if (this.currentService === 3 && !document.getElementById('upgradeDescription')?.value.trim()) {
            this.showError('Пожалуйста, укажите какие детали нужно заменить');
            return false;
        }
        
        if (!this.selectedTime) {
            this.showError('Пожалуйста, выберите удобное время');
            return false;
        }
        
        const dateInput = document.getElementById('appointmentDate');
        if (!dateInput.value) {
            this.showError('Пожалуйста, выберите дату');
            return false;
        }
        
        // Проверка даты (не раньше завтра)
        const selectedDate = new Date(dateInput.value);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        if (selectedDate < tomorrow) {
            this.showError('Пожалуйста, выберите дату не раньше завтрашнего дня');
            return false;
        }
        
        if (this.currentService === 4 && !this.windowsVersion) {
            this.showError('Пожалуйста, выберите версию Windows');
            return false;
        }
        
        return true;
    }

    showError(message) {
        // Удаляем существующие toast
        document.querySelectorAll('.error-toast').forEach(toast => {
            toast.remove();
        });
        
        // Создаем новый toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        // Анимация появления
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Автоматическое удаление через 3 секунды
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    submitOrder(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }
        
        // Сохранение данных пользователя
        this.saveUserData();
        
        // Сбор данных заказа
        const orderData = {
            service: this.currentService,
            serviceName: document.getElementById('selectedServiceText').textContent,
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            description: document.getElementById('pcDescription')?.value || 
                        document.getElementById('cleaningDescription')?.value ||
                        document.getElementById('upgradeDescription')?.value ||
                        document.getElementById('windowsDescription')?.value || '',
            time: this.selectedTime,
            date: document.getElementById('appointmentDate').value,
            windowsVersion: this.windowsVersion,
            installDrivers: document.getElementById('installDrivers')?.checked || false,
            options: this.selectedOptions,
            price: this.calculatePrice().basePrice,
            timeline: this.getTimeline(),
            orderDate: new Date().toISOString(),
            orderId: 'FS-' + Date.now().toString().slice(-8)
        };
        
        // Сохранение заказа
        this.saveOrder(orderData);
        
        // Показать экран успеха
        this.showSuccessScreen();
        this.displayOrderDetails(orderData);
        
        // Отправка данных в Telegram (если нужно)
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.sendData(JSON.stringify(orderData));
        }
    }

    saveUserData() {
        const userData = {
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value
        };
        
        localStorage.setItem('frameSpiritUserData', JSON.stringify(userData));
    }

    saveOrder(orderData) {
        const orders = JSON.parse(localStorage.getItem('frameSpiritOrders') || '[]');
        orders.push(orderData);
        localStorage.setItem('frameSpiritOrders', JSON.stringify(orders));
    }

    displayOrderDetails(orderData) {
        let optionsText = 'Без дополнительных опций';
        if (Object.keys(orderData.options).length > 0) {
            const option = Object.values(orderData.options)[0];
            optionsText = option.name;
        }
        
        let windowsInfo = '';
        if (orderData.service === 4) {
            windowsInfo = `<p><strong>Версия Windows:</strong> ${orderData.windowsVersion}</p>
                           <p><strong>Установка драйверов:</strong> ${orderData.installDrivers ? 'Да' : 'Нет'}</p>`;
        }
        
        const detailsHTML = `
            <div>
                <p><strong>Номер заказа:</strong> ${orderData.orderId}</p>
                <p><strong>Услуга:</strong> ${orderData.serviceName}</p>
                ${windowsInfo}
                <p><strong>Описание:</strong> ${orderData.description || 'Нет описания'}</p>
                <p><strong>Опции:</strong> ${optionsText}</p>
                <p><strong>Дата:</strong> ${new Date(orderData.date).toLocaleDateString('ru-RU')}</p>
                <p><strong>Время:</strong> ${orderData.time}</p>
                <p><strong>Стоимость:</strong> ${orderData.price} BYN</p>
                <p><strong>Срок выполнения:</strong> ${orderData.timeline}</p>
                <p><strong>Контакты:</strong> ${orderData.fullName}, ${orderData.phone}</p>
                <p><strong>Адрес:</strong> ${orderData.address}</p>
            </div>
        `;
        
        document.getElementById('orderDetails').innerHTML = detailsHTML;
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FrameSpiritApp();
    
    // Установка минимальной даты (завтра)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
    
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.min = tomorrowFormatted;
        dateInput.value = tomorrowFormatted;
        window.app.selectedDate = tomorrowFormatted;
    }
    
    // Установка дефолтного времени
    const firstTimeSlot = document.querySelector('.time-slot');
    if (firstTimeSlot) {
        firstTimeSlot.classList.add('selected');
        window.app.selectedTime = firstTimeSlot.dataset.time;
    }
});