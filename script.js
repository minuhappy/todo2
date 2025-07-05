class FirebaseTodoApp {
    constructor() {
        this.todos = [];
        this.currentUser = null;
        this.unsubscribeTodos = null;
        
        this.initializeElements();
        this.addEventListeners();
        this.checkAuthState();
    }
    
    initializeElements() {
        // 인증 관련 요소들
        this.authModal = document.getElementById('authModal');
        this.mainContainer = document.getElementById('mainContainer');
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.switchAuthBtn = document.getElementById('switchAuthBtn');
        this.authTitle = document.getElementById('authTitle');
        this.switchText = document.getElementById('switchText');
        this.authError = document.getElementById('authError');
        this.userEmail = document.getElementById('userEmail');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        // 할일 관련 요소들
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.totalCount = document.getElementById('totalCount');
        this.completedCount = document.getElementById('completedCount');
        this.remainingCount = document.getElementById('remainingCount');
    }
    
    addEventListeners() {
        // 인증 이벤트
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        this.switchAuthBtn.addEventListener('click', () => this.switchAuthMode());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // 할일 이벤트
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
    }
    
    // 인증 상태 확인
    checkAuthState() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.showMainApp();
                this.loadTodos();
            } else {
                this.currentUser = null;
                this.showAuthModal();
                this.unsubscribeFromTodos();
            }
        });
    }
    
    // 로그인 처리
    async handleLogin(e) {
        e.preventDefault();
        this.showLoading();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            this.hideLoading();
            this.clearAuthError();
        } catch (error) {
            this.hideLoading();
            this.showAuthError(this.getErrorMessage(error.code));
        }
    }
    
    // 회원가입 처리
    async handleSignup(e) {
        e.preventDefault();
        this.showLoading();
        
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            this.hideLoading();
            this.clearAuthError();
        } catch (error) {
            this.hideLoading();
            this.showAuthError(this.getErrorMessage(error.code));
        }
    }
    
    // 로그아웃 처리
    async handleLogout() {
        try {
            await auth.signOut();
            this.showMessage('로그아웃되었습니다.', 'info');
        } catch (error) {
            this.showMessage('로그아웃 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // 인증 모드 전환
    switchAuthMode() {
        const isLoginMode = this.loginForm.style.display !== 'none';
        
        if (isLoginMode) {
            // 회원가입 모드로 전환
            this.loginForm.style.display = 'none';
            this.signupForm.style.display = 'flex';
            this.authTitle.textContent = '회원가입';
            this.switchText.textContent = '이미 계정이 있으신가요? ';
            this.switchAuthBtn.textContent = '로그인';
        } else {
            // 로그인 모드로 전환
            this.loginForm.style.display = 'flex';
            this.signupForm.style.display = 'none';
            this.authTitle.textContent = '로그인';
            this.switchText.textContent = '계정이 없으신가요? ';
            this.switchAuthBtn.textContent = '회원가입';
        }
        
        this.clearAuthError();
    }
    
    // 할일 추가
    async addTodo() {
        const text = this.todoInput.value.trim();
        
        if (text === '') {
            this.showMessage('할일을 입력해주세요!', 'error');
            return;
        }
        
        if (!this.currentUser) {
            this.showMessage('로그인이 필요합니다.', 'error');
            return;
        }
        
        const todo = {
            text: text,
            completed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: this.currentUser.uid
        };
        
        try {
            await db.collection('todos').add(todo);
            this.todoInput.value = '';
            this.todoInput.focus();
            this.showMessage('할일이 추가되었습니다!', 'success');
        } catch (error) {
            console.error('할일 추가 오류:', error);
            this.showMessage('할일 추가 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // 할일 완료/미완료 토글
    async toggleTodo(id) {
        try {
            const todoRef = db.collection('todos').doc(id);
            const todoDoc = await todoRef.get();
            
            if (todoDoc.exists && todoDoc.data().userId === this.currentUser.uid) {
                await todoRef.update({
                    completed: !todoDoc.data().completed
                });
                
                const message = todoDoc.data().completed ? '완료를 취소했습니다!' : '완료되었습니다!';
                this.showMessage(message, 'info');
            }
        } catch (error) {
            console.error('할일 토글 오류:', error);
            this.showMessage('상태 변경 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // 할일 삭제
    async deleteTodo(id) {
        try {
            const todoRef = db.collection('todos').doc(id);
            const todoDoc = await todoRef.get();
            
            if (todoDoc.exists && todoDoc.data().userId === this.currentUser.uid) {
                await todoRef.delete();
                this.showMessage('할일이 삭제되었습니다!', 'success');
            }
        } catch (error) {
            console.error('할일 삭제 오류:', error);
            this.showMessage('삭제 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // 할일 목록 로드
    loadTodos() {
        if (!this.currentUser) return;
        
        this.showLoading();
        
        // 기존 리스너 해제
        this.unsubscribeFromTodos();
        
        // 실시간 리스너 설정
        this.unsubscribeTodos = db.collection('todos')
            .where('userId', '==', this.currentUser.uid)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                this.todos = [];
                snapshot.forEach((doc) => {
                    this.todos.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                this.renderTodos();
                this.updateStats();
                this.hideLoading();
            }, (error) => {
                console.error('할일 로드 오류:', error);
                this.hideLoading();
                this.showMessage('데이터 로드 중 오류가 발생했습니다.', 'error');
            });
    }
    
    // 할일 목록 렌더링
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
    
    // 할일 요소 생성
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
    
    // 통계 업데이트
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const remaining = total - completed;
        
        this.totalCount.textContent = `전체: ${total}`;
        this.completedCount.textContent = `완료: ${completed}`;
        this.remainingCount.textContent = `남은 할일: ${remaining}`;
    }
    
    // UI 표시/숨김
    showAuthModal() {
        this.authModal.style.display = 'flex';
        this.mainContainer.style.display = 'none';
    }
    
    showMainApp() {
        this.authModal.style.display = 'none';
        this.mainContainer.style.display = 'block';
        this.userEmail.textContent = this.currentUser.email;
    }
    
    showLoading() {
        this.loadingIndicator.style.display = 'flex';
    }
    
    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }
    
    // 리스너 해제
    unsubscribeFromTodos() {
        if (this.unsubscribeTodos) {
            this.unsubscribeTodos();
            this.unsubscribeTodos = null;
        }
    }
    
    // 유틸리티 함수들
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': '등록되지 않은 이메일입니다.',
            'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
            'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
            'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
            'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
            'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
        };
        
        return errorMessages[errorCode] || '오류가 발생했습니다. 다시 시도해주세요.';
    }
    
    showAuthError(message) {
        this.authError.textContent = message;
        this.authError.style.display = 'block';
    }
    
    clearAuthError() {
        this.authError.textContent = '';
        this.authError.style.display = 'none';
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

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new FirebaseTodoApp();
}); 