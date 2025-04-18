export const notificationQueue = [];
export const activeNotifications = [];
export const maxNotifications = 3;

export function showNotification(message, type, duration = 3500) {
    notificationQueue.push({ message, type, duration });
    if (activeNotifications.length < maxNotifications) {
        displayNextNotification();
    } else {
        const oldestNotification = activeNotifications.shift();
        if (oldestNotification.type === 'success' || oldestNotification.type === 'loading') {
            removeNotification(oldestNotification.element);
            displayNextNotification();
        }
    }
}

function displayNextNotification() {
    if (notificationQueue.length === 0) {
        return;
    }

    const { message, type, duration } = notificationQueue.shift();
    const notificationContainer = document.querySelector('.notification-container') || createNotificationContainer();
    const notificationBar = document.createElement('div');
    notificationBar.className = 'notification-bar';
    const notificationIcon = document.createElement('svg');
    notificationIcon.className = 'notification-icon';
    notificationIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    notificationIcon.setAttribute('viewBox', '0 0 24 24');
    notificationIcon.setAttribute('width', '24');
    notificationIcon.setAttribute('height', '24');
    const notificationText = document.createElement('span');
    notificationText.id = 'notification-text';
    notificationText.textContent = message;

    switch (type) {
        case 'success':
            notificationBar.style.backgroundColor = '#4CAF50';
            notificationIcon.innerHTML = '<path fill="white" d="M9 16.2l-4.2-4.2-1.4 1.4 5.6 5.6 12-12-1.4-1.4z"/>';
            break;
        case 'error':
            notificationBar.style.backgroundColor = '#F44336';
            notificationIcon.innerHTML = '<path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13l-1.41 1.41L12 13.41l-3.59 3.59L7 15l3.59-3.59L7 7.83 8.41 6.41 12 10l3.59-3.59L17 7.83l-3.59 3.59L17 15z"/>';
            break;
        case 'warning':
            notificationBar.style.backgroundColor = '#FF9800';
            notificationIcon.innerHTML = '<path fill="white" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>';
            break;
        case 'info':
            notificationBar.style.backgroundColor = '#2196F3';
            notificationIcon.innerHTML = '<path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z"/>';
            break;
        case 'loading':
            notificationBar.style.backgroundColor = '#808080';
            notificationIcon.innerHTML = '<path fill="white" class="loading-icon" d="M12 2 A10 10 0 0 1 22 12"/>';
            break;
    }

    notificationBar.appendChild(notificationIcon);
    notificationBar.appendChild(notificationText);
    notificationContainer.appendChild(notificationBar);

    notificationBar.style.boxShadow = '0px 5px 15px rgba(0,0,0,0.3)';
    notificationBar.classList.add('show');
    activeNotifications.push({ element: notificationBar, type });

    setTimeout(() => {
        notificationBar.classList.remove('show');
        notificationBar.classList.add('hide');
        setTimeout(() => {
            removeNotification(notificationBar);
            displayNextNotification();
        }, 500); // Wait for the fade-out animation to complete
    }, duration);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

function removeNotification(notificationBar) {
    notificationBar.remove();
    activeNotifications.shift();
}
