function goSignup() {
    window.location.replace('/signup');
}

function goLogin() {
    var id = $("#inputID").val();
    var password = $("#inputPassword").val();
    if (id === "") alert("아이디를 입력하세요.");
    else if (password === "") alert("패스워드를 입력하세요.");
    else {
        var myForm = document.login;
        myForm.id.value = id;
        myForm.password.value = password;
        myForm.submit();
    }
}