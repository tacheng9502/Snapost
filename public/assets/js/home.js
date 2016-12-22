jQuery(document).ready(function ($) {
    var newImageFile, userName, userImage, userId;

    function showPost() {
        var array = [];

        firebase.database().ref('posts').once("value", function (snapshot) {
            $('#list').children().remove();
            snapshot.forEach(function (data) {
                var post = {
                    postKey: data.key,
                    userId: data.val().userId,
                    userName: data.val().userName,
                    userImage: data.val().userImage,
                    postBody: data.val().postBody,
                    postTime: data.val().postTime,
                    postImage: data.val().postImage,
                    likeCount: data.val().likeCount
                };
                array.push(post);
                array.reverse();
            });

            for (var i = 0; i < array.length; i++) {
                var date = new Date(parseInt(array[i].postTime));
                if (userId === array[i].userId) {
                    $('#list').append(
                        '<li>' +
                        '<div class="info"><a href="/profile?u=' + array[i].userId + '" >' +
                        '<img src="' + array[i].userImage + '" class="img-circle" width="25px">' +
                        '<h2 id="' + array[i].postKey + '_userName">' + array[i].userName + '</h2></a>' +
                        '<span id="' + array[i].postKey + '_postTime" class="time">' + date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() + '/' + date.getDate().toString() + ' ' + date.getHours().toString() + ':' + date.getMinutes().toString() + '</span>' +
                        '<div id="' + array[i].postKey + '_operate" class="navi pull-right">' +
                        '<button id="' + array[i].postKey + '_update" class="btn btn-default" onclick="clickUpdate(event)" >' +
                        '<i id="' + array[i].postKey + '_update" class="fa fa-pencil" onclick="clickUpdate(event)" title="edit"></i></button>&nbsp;' +
                        '<button id="' + array[i].postKey + '_delete" class="btn btn-default" onclick="clickDelete(event)" >' +
                        '<i id="' + array[i].postKey + '_delete" class="fa fa-trash" onclick="clickDelete(event)" title="delete"></i></button>' +
                        '</div></div>' +
                        '<p id="' + array[i].postKey + '_body">' + array[i].postBody + '</p>' +
                        '<img id="' + array[i].postKey + '_postImage" class="postImage" src="' + array[i].postImage + '"/>' +
                        '<button id="' + array[i].postKey + '_like" class="btn btn-default" onclick="" >' +
                        '<i id="' + array[i].postKey + '_like" class="fa fa-heart-o" onclick="clickLike(event)" title="edit"></i></button>' + array[i].likeCount + '</br>' +
                        '<div class="input-group">' +
                        '<input id="' + array[i].postKey + '_commentBody" type="text" class="form-control" placeholder="留言...">' +
                        '<span class="input-group-btn">' +
                        '<button id="' + array[i].postKey + '_comment" class="btn btn-primary" onclick="writeNewComment(event)" type="button">發送</button>' +
                        '</span>' +
                        '</div>' +
                        '<ul id="' + array[i].postKey + '_commentList" class="msg"></ul>' +
                        '</li>'
                    );
                } else {
                    $('#list').append(
                        '<li>' +
                        '<div class="info"><a href="/profile?u=' + array[i].userId + '" >' +
                        '<img src="' + array[i].userImage + '" class="img-circle" width="25px">' +
                        '<h2 id="' + array[i].postKey + '_userName">' + array[i].userName + '</h2></a>' +
                        '<span id="' + array[i].postKey + '_postTime" class="time">' + date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() + '/' + date.getDate().toString() + ' ' + date.getHours().toString() + ':' + date.getMinutes().toString() + '</span>' +
                        '</div>' +
                        '<p id="' + array[i].postKey + '_body">' + array[i].postBody + '</p>' +
                        '<img id="' + array[i].postKey + '_postImage" class="postImage" src="' + array[i].postImage + '"/>' +
                        '<button id="' + array[i].postKey + '_like" class="btn btn-default" onclick="" >' +
                        '<i id="' + array[i].postKey + '_like" class="fa fa-heart-o" onclick="clickLike(event)" title="edit"></i></button>' + array[i].likeCount + '</br>' +
                        '<div class="input-group">' +
                        '<input id="' + array[i].postKey + '_commentBody" type="text" class="form-control" placeholder="留言...">' +
                        '<span class="input-group-btn">' +
                        '<button id="' + array[i].postKey + '_comment" class="btn btn-primary" onclick="writeNewComment(event)" type="button">發送</button>' +
                        '</span>' +
                        '</div>' +
                        '<ul id="' + array[i].postKey + '_commentList" class="msg"></ul>' +
                        '</li>'
                    );
                }

                firebase.database().ref('/post-comments/' + array[i].postKey).once("value", function (snapshot) {
                    snapshot.forEach(function (data) {
                        var comment = {
                            userId: data.val().userId,
                            userName: data.val().userName,
                            userImage: data.val().userImage,
                            commentBody: data.val().commentBody,
                            commentTime: data.val().commentTime
                        };
                        $('#' + array[i].postKey + '_commentList').append(
                            '<li>' + comment.userName + '：' + comment.commentBody + '</li>'
                        );
                    });
                });

            }
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    }

    firebase.auth().onAuthStateChanged(function (user) {
        if (!user) {
            window.location.href = 'https://snapost.herokuapp.com/';
        } else {
            userName = user.displayName;
            userImage = user.photoURL;
            userId = user.uid;
            $('#userInfo').html(
                '<img src="' + userImage + '" class="img-circle" width="30px">&nbsp;&nbsp;' +
                '<span>' + userName + '</span>'
            );
            showPost();
        }
    });

    $("#img_input").on('click', function () {
        var file = $(this).parent().parent().parent().find('.file');
        file.trigger('click');
    });

    $("#file").on("change", function (event) {
        $(this).parent().find('.form-control').val($(this).val().replace(/C:\\fakepath\\/i, ''));
        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // 讀取檔案
        reader.onload = function (arg) {
            var img = '<img class="preview" src="' + arg.target.result + '" alt="preview"/>';
            $("#img_preview").empty().append(img);
            newImageFile = $('.preview').croppie({
                viewport: {
                    width: 600,
                    height: 600,
                    type: 'square'
                },
                boundary: {
                    width: 600,
                    height: 600
                }
            });
        }
    });

    $('#clearNewPost').on('click', function (event) {
        event.preventDefault();
        $('.form-control').val("");
        $('#newPost_body').val("");
        $("#img_preview").empty();
        newImageFile = null;
    });

    $('#userInfo').on('click', function (event) {
        event.preventDefault();
        window.location.href = "/profile?u=" + userId;
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
            size: 'viewport',
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
                        userId: userId,
                        userName: userName,
                        userImage: userImage,
                        postBody: postBody,
                        postTime: postTime,
                        postImage: downloadURL
                    };

                    var sets = {};
                    sets['/posts/' + newPostKey] = postData;

                    firebase.database().ref().update(sets);
                    $('.form-control').val("");
                    $('#newPost_body').val("");
                    $("#img_preview").empty();
                    newImageFile = null;
                    showPost();

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
                    width: 600,
                    height: 600,
                    type: 'square'
                },
                boundary: {
                    width: 600,
                    height: 600
                }
            });
        }
    }

    window.sendUpdate = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -5);
        var date = new Date();
        var postTime = date.getTime();
        var postBody = $('#' + postKey + '_newBody').val();
        var postImage = $('#' + postKey + '_postImage').attr('src');

        var postData = {
            userId: userId,
            userName: userName,
            userImage: userImage,
            postBody: postBody,
            postTime: postTime,
            postImage: postImage
        };

        var updates = {};
        updates['/posts/' + postKey] = postData;
        firebase.database().ref().update(updates);
        showPost();
    }

    window.clickUpdate = function (event) {
        event.preventDefault();
        var updateId = event.target.id.slice(0, -7);

        $('#' + updateId + '_operate').html(
            '<button id="' + updateId + '_send" class="btn btn-default" onclick="sendUpdate(event)" >' +
            '<i id="' + updateId + '_send" class="fa fa-floppy-o" onclick="sendUpdate(event)" title="save"></i></a>'
        );
        var oldBody = $('#' + updateId + '_body').text();
        $('#' + updateId + '_body').html(
            '<textarea id="' + updateId + '_newBody" class="form-control" rows="3">' + oldBody + '</textarea>'
        );
    }

    window.clickDelete = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -7);
        var timeArray = $('#' + postKey + '_postTime').text().split("/");

        swal({
                title: "確認刪除留言?",
                text: "刪除後留言將無法復原",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "刪除",
                closeOnConfirm: false
            },
            function () {
                var deletes = {};
                deletes['/posts/' + postKey] = null;
                firebase.database().ref().update(deletes);
                swal("已刪除", "留言已經成功刪除", "success");
                firebase.database().ref('statistic/' + timeArray[0] + '-' + timeArray[1] + '/postCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
                showPost();
            });
    }

    window.writeNewComment = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -8);
        var date = new Date();
        var commentTime = date.getTime();
        var commentBody = $('#' + postKey + '_commentBody').val();
        var newCommentKey = firebase.database().ref().child('post-comments').push().key;

        var commentData = {
            userId: userId,
            userName: userName,
            userImage: userImage,
            commentBody: commentBody,
            commentTime: commentTime
        };

        var updates = {};
        updates['/post-comments/' + postKey + '/' + newCommentKey] = commentData;
        firebase.database().ref().update(updates);
        $('#' + postKey + '_commentBody').val("");
        showPost();
    }

    window.clickLike = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -5);
        firebase.database().ref('/post-likes/' + postKey + '/' + userId).once("value", function (snapshot) {
            if (snapshot) {
                var deletes = {};
                deletes['/post-likes/' + postKey + '/' + userId] = null;
                firebase.database().ref().update(deletes);
                firebase.database().ref('/posts/' + postKey + '/' + 'likeCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
            } else {
                var likeData = {
                    userId: userId,
                    userName: userName
                };
                var updates = {};
                updates['/post-likes/' + postKey + '/' + userId] = likeData;
                firebase.database().ref().update(updates);
                firebase.database().ref('/posts/' + postKey + '/' + 'likeCount').transaction(function (currentCount) {
                    return currentCount + 1;
                });
            }
        });
    }

});