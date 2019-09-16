function clear() {
    window.reload();
    return true;
}

function reply(){
    var text = $("#replyText").val();
    if(text.trim() !==""){
        var myForm = document.replyhook;
        myForm.text.value = $("#replyText").val();
        myForm.submit();
        $("#replyText").val("");
    }   
}

function finish(id){
    if(confirm("정말 완료하시겠습니까?") === true){
        var myForm = document.finished;
        myForm.userid.value = id;
        myForm.submit();
        alert("상담이 완료되었습니다!");
        window.close();        
    }else alert("취소되었습니다.")
}