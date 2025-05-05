# 前端获取和使用Token
1. 登录获取Token

```javascript
// 发送登录请求
async function login(username, password) {
    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    // 保存token到localStorage
    localStorage.setItem('token', data.token);
}
```
2. 在请求中使用Token
```javascript
// 在请求头中添加token
async function makeAuthenticatedRequest(url) {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json();
}

// 示例：获取用户信息
async function getUserInfo() {
    return await makeAuthenticatedRequest('/me');
}
```
