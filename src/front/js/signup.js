//import { json } from "../../../../../../AppData/Local/Microsoft/TypeScript/3.5/node_modules/@types/body-parser";

function goBack() {
    if (confirm("정말 나가시겠습니까?") === true) {
        window.location.replace('/login');
    } else {
        alert("취소되었습니다.");
    }
}

function goSignup() {
    var id = $("#inputID").val();
    var password = $("#inputPassword").val();
    var nickname = $("#inputNickname").val();
    var channelSecret = $("#inputChannelSecret").val();
    var channelAccessToken = $("#inputChannelAccessToken").val();
    var channelId = $("#inputChannelId").val();

    if (id === "") alert("아이디를 입력하세요.");
    else if (password === "") alert("패스워드를 입력하세요.");
    else if (nickname === "") alert("이름을 입력하세요");
    else if (channelSecret === "") alert("channel secret을 입력하세요.");
    else if (channelAccessToken === "") alert("channel access token을 입력하세요.");
    else if (channelId === "") alert("channel ID를 입력하세요.");
    else {
        var myForm = document.signup;
        myForm.id.value = id;
        myForm.password.value = password;
        myForm.nickname.value = nickname;
        myForm.channelSecret.value = channelSecret;
        myForm.channelAccessToken.value = channelAccessToken;
        myForm.channelId.value = channelId;
        myForm.submit();
    }
}

/*
function checkID() {
    var id = $("#inputID").val();
    $.post({
        url : "/checkID",
        datatype : 'json',
        data : {data : id},
        success : function(result){
            if(result) alert("성공!");
            else alert("실패!");
        }
    })
}*/