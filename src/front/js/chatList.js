function openChatRoom(id) {
    var myForm = document.chatRoom;
    window.open("/chatRoom/" + id, id, "width=450, height=600, resizable=no, directories=no, status=no, location=no");
    myForm.target = id;
    myForm.userid.value = id;
    myForm.submit();
}

function openChatRoomOnDate(id, date) {
    var myForm = document.chatRoomOnDate;
    window.open("/chatRoomOnDate", id + date, "width=450, height=600, resizable=no, directories=no, status=no, location=no");
    myForm.target = id + date;
    myForm.userid.value = id;
    myForm.date.value = date;
    myForm.submit();
}

function openChatListOnDate() {
    var pattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
    var date = $("#testDatepicker").val();
    if (pattern.test(date)) {
        var myForm = document.chatListOnDate;
        myForm.date.value = date;
        myForm.submit();
    } else {
        alert("잘못된 날짜형식입니다.")
    }
}

function goback() {
    window.location.replace('/chatList');
}

function logout() {
    if (confirm("정말 로그아웃 하시겠습니까?") === true) {
        var myForm = document.out;
        myForm.submit();
        alert("로그아웃 되었습니다.");
    } else {
        alert("취소되었습니다.");
    }
}

/*jquery-ui의 datepicker */
$.datepicker.setDefaults({
    dateFormat: 'yy-mm-dd',
    prevText: '이전 달',
    nextText: '다음 달',
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dayNames: ['일', '월', '화', '수', '목', '금', '토'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
    showMonthAfterYear: true,
    yearSuffix: '년'
});

$(function () {
    $("#testDatepicker").datepicker();
});