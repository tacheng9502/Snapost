jQuery(document).ready(function ($) {
    var userName, userImage, currentUserId, queryName;
    var listeningFirebaseRefs = [];

    firebase.auth().onAuthStateChanged(function (user) {
        if (!user) {
            window.location.href = 'https://snapost.herokuapp.com/';
        } else {
            startDatabaseQueries();
        }
    });
	function startDatabaseQueries() {
		var adRef = firebase.database.ref('/adverts');
        var adHtml = "";
        adRef.once('value', function(snapshot){
            $("#list").empty();
            snapshot.forEach(function (data) {
                var name = data.key;
                var clickCount = data.val().clickCount;
                var sponserName = data.val().sponserName;
                adHtml += '<tr>\
                            <td>' + name + '</td>\
                            <td>' + clickCount + '</td>\
                            <td>' + sponserName + '</td>\
                            <td><button id="' + name + '_mod" type="button">編輯</button></td>\
                            <td><button id="' + name + '_del" type="button">刪除</button></td>\
                            </tr>';
            });
            $("#list").append(adHtml);
        });
	}

	$('#clearNewPost').on('click', function (event) {
        event.preventDefault();
        $('#newPost_body').val("");
        $("#img_preview").empty();
        newImageFile = null;
    });

    $('#writeNewPost').on('click', function (event) {
        event.preventDefault();
        var postBody = $('#newPost_body').val();
        var date = new Date();
        var postTime = date.getTime();
        var newPostKey = firebase.database().ref().child('posts').push().key;
        var metadata = {
            contentType: 'image/jpeg'
        };

        newImageFile.croppie('result', {
            type: 'blob',
            size: {
                width: 600,
                height: 600
            },
            format: 'jpeg'
        }).then(function (resp) {
            var uploadTask = firebase.storage().ref().child('postImage/' + newPostKey).put(resp, metadata);
            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
                function (snapshot) {
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED:
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING:
                            console.log('Upload is running');
                            break;
                    }
                },
                function (error) {
                    switch (error.code) {
                        case 'storage/unauthorized':
                            // User doesn't have permission to access the object
                            break;
                        case 'storage/canceled':
                            // User canceled the upload
                            break;
                        case 'storage/unknown':
                            // Unknown error occurred, inspect error.serverResponse
                            break;
                    }
                },
                function () {
                    // Upload completed successfully, now we can get the download URL
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    // A post entry.
                    var postData = {
                        userId: currentUserId,
                        userName: userName,
                        userImage: userImage,
                        postBody: postBody,
                        postTime: postTime,
                        postImage: downloadURL,
                        likeCount: 0
                    };

                    var sets = {};
                    sets['/posts/' + newPostKey] = postData;
                    sets['/users/' + currentUserId + '/userPost/' + newPostKey] = downloadURL;
                    firebase.database().ref().update(sets);
                    firebase.database().ref('/users/' + currentUserId + '/userPostCount').transaction(function (currentCount) {
                        return currentCount + 1;
                    });
                    $('#newPost_body').val("");
                    $("#img_preview").empty();
                    newImageFile = null;

                    var thisYear = date.getFullYear();
                    var thisMonth = date.getMonth() + 1;
                    firebase.database().ref('statistic/' + thisYear + '-' + thisMonth + '/postCount').transaction(function (currentCount) {
                        return currentCount + 1;
                    });
                });
        });
    });

	window.dragHandler = function (e) {
        e.stopImmediatePropagation(); //防止瀏覽器執行預設動作
        e.preventDefault();
    }

    window.dropImage = function (e) {
        e.stopImmediatePropagation(); //防止瀏覽器執行預設動作
        e.preventDefault();
        var reader = new FileReader();
        reader.readAsDataURL(e.dataTransfer.files[0]); // 讀取檔案
        // 渲染至頁面
        reader.onload = function (arg) {
            var img = '<img class="preview" src="' + arg.target.result + '" alt="preview"/>';
            $("#img_preview").empty().append(img);
            newImageFile = $('.preview').croppie({
                viewport: {
                    width: 400,
                    height: 400,
                    type: 'square'
                },
                boundary: {
                    width: 400,
                    height: 400
                }
            });
        }
    }
})