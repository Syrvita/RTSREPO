document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const emailInput = document.getElementById("email").value;
    const passInput = document.getElementById("password").value;
    const db = JSON.parse(localStorage.getItem("roverDB"));
    const authenticatedUser = db.users.find(u => u.email === emailInput && u.password === passInput);
    
    if (authenticatedUser) {
        sessionStorage.setItem("activeSession", JSON.stringify(authenticatedUser));
        const routes = { "Admin": "admin.html", "Manager": "manager.html", "Driver": "driver.html", "Client": "client.html" };
        window.location.href = routes[authenticatedUser.role];
    } else {
        document.getElementById("errorMessage").style.display = "block";
    }
});
