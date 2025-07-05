class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.totalCount = document.getElementById('totalCount');
        this.completedCount = document.getElementById('completedCount');
        this.remainingCount = document.getElementById('remainingCount');
        
        this.init();
    }
    
    init() {
        this.addEventListeners();
        this.renderTodos();
        this.updateStats();
    }
    
    addEventListeners() {
        // 추가 버튼 클릭 이벤트
        this.addBtn.addEventListener('click', () => this.addTodo());
        
        // 엔터키 이벤트
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
        
        // 입력창 포커스 이벤트
        this.todoInput.addEventListener('focus', () => {
            this.todoInput.placeholder = '할일을 입력하세요...';
        });
    }
    
    addTodo() {
        const text = this.todoInput.value.trim();
        
        if (text === '') {
            this.showMessage('할일을 입력해주세요!', 'error');
            return;
        }
        
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.push(todo);
        this.saveToLocalStorage();
        this.renderTodos();
        this.updateStats();
        
        // 입력창 초기화
        this.todoInput.value = '';
        this.todoInput.focus();
        
        this.showMessage('할일이 추가되었습니다!', 'success');
    }
    
    toggleTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToLocalStorage();
            this.renderTodos();
            this.updateStats();
            
            const message = todo.completed ? '완료되었습니다!' : '완료를 취소했습니다!';
            this.showMessage(message, 'info');
        }
    }
    
    deleteTodo(id) {
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        if (todoItem) {
            todoItem.classList.add('removing');
            
            setTimeout(() => {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.saveToLocalStorage();
                this.renderTodos();
                this.updateStats();
                this.showMessage('할일이 삭제되었습니다!', 'success');
            }, 150);
        }
    }
    
    renderTodos() {
        this.todoList.innerHTML = '';
        
        if (this.todos.length === 0) {
            return;
        }
        
        this.todos.forEach(todo => {
            const todoItem = this.createTodoElement(todo);
            this.todoList.appendChild(todoItem);
        });
    }
    
    createTodoElement(todo) {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        todoItem.setAttribute('data-id', todo.id);
        
        todoItem.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${this.escapeHtml(todo.text)}</span>
            <button class="delete-btn">삭제</button>
        `;
        
        // 체크박스 이벤트
        const checkbox = todoItem.querySelector('.todo-checkbox');
        checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
        
        // 삭제 버튼 이벤트
        const deleteBtn = todoItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
        
        return todoItem;
    }
    
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const remaining = total - completed;
        
        this.totalCount.textContent = `전체: ${total}`;
        this.completedCount.textContent = `완료: ${completed}`;
        this.remainingCount.textContent = `남은 할일: ${remaining}`;
    }
    
    saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // 스타일 적용
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // 타입별 색상
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        
        messageDiv.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(messageDiv);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }, 3000);
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
}); 