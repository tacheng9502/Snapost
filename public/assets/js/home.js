jQuery(document).ready(function ($) {
    var newImageFile, userName, userImage, currentUserId;
    var listeningFirebaseRefs = [];

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            currentUserId = user.uid;
            userName = user.displayName;
            userImage = user.photoURL;
            $('#intro').attr("hidden", true);
            $('#content').removeAttr("hidden");
            $('#userInfo').html(
                '<img src="' + userImage + '" class="img-circle" width="30px">&nbsp;&nbsp;' +
                '<span>' + userName + '</span>'
            );
            startDatabaseQueries();
        } else {
            currentUserId = null;
            userName = null;
            userImage = null;
            $('#intro').removeAttr("hidden");
            $('#content').attr("hidden", true);
            listeningFirebaseRefs.forEach(function (ref) {
                ref.off();
            });
            listeningFirebaseRefs = [];
        }
    });

    $('#facebookLogin').on('click', function (event) {
        event.preventDefault();
        var provider = new firebase.auth.FacebookAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function (result) {
            var token = result.credential.accessToken;
            var user = result.user;

            firebase.database().ref('users/' + user.uid + '/userName/').once("value", function (snapshot) {
                if (snapshot.val() == null) {
                    var userData = {
                        userId: user.uid,
                        userName: user.displayName,
                        userImage: user.photoURL,
                        userPostCount: 0,
                        userFanCount: 0,
                        userFollowCount: 0
                    };
                    var updates = {};
                    updates['/users/' + user.uid + '/'] = userData;
                    firebase.database().ref().update(updates);
                    var date = new Date();
                    var thisYear = date.getFullYear();
                    var thisMonth = date.getMonth() + 1;
                    firebase.database().ref('/statistic/' + thisYear + '-' + thisMonth + '/' + 'userCount').transaction(function (currentCount) {
                        return currentCount + 1;
                    });
                }
            });


        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
            console.log(errorCode);
        });
    })

    function startDatabaseQueries() {

        var postsRef = firebase.database().ref('posts').limitToLast(8);
        postsRef.on('child_added', function (data) {
            var html = createPostElement(data.key, data.val().userId, data.val().userName, data.val().userImage, data.val().postBody, data.val().postTime, data.val().postImage, data.val().likeCount);
            $('#list').prepend(html);
        });
        postsRef.on('child_changed', function (data) {
            $('#' + data.key + '_body').text(data.val().postBody);
        });
        postsRef.on('child_removed', function (data) {
            $('#' + data.key).remove();
        });

        listeningFirebaseRefs.push(postsRef);
        showAdvertisment();
    }

    function createPostElement(postKey, userId, userName, userImage, postBody, postTime, postImage, likeCount) {
        var date = new Date(parseInt(postTime));
        var likeStatus;
        firebase.database().ref('posts/' + postKey + '/likes/' + currentUserId).once("value", function (snapshot) {
            likeStatus = snapshot.val();
        });

        var html =
            '<li id="' + postKey + '">' +
            '<div class="info">' +
            '<a id="' + postKey + '_profile" href="/profile?u=' + userId + '" >' +
            '<img id="' + postKey + '_userImage" src="' + userImage + '" class="img-circle" width="25px" height="25px">' +
            '<h2 id="' + postKey + '_userName">' + userName + '</h2>' +
            '</a>' +
            '<span id="' + postKey + '_postTime" class="time">' + date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() + '/' + date.getDate().toString() + ' ' + date.getHours().toString() + ':' + date.getMinutes().toString() + '</span>';

        if (currentUserId === userId) {
            html = html +
                '<div id="' + postKey + '_operate" class="navi pull-right">' +
                '<button id="' + postKey + '_update" class="btn btn-default" onclick="clickUpdate(event)" >' +
                '<i id="' + postKey + '_update" class="fa fa-pencil" onclick="clickUpdate(event)" title="edit"></i>' +
                '</button>&nbsp;' +
                '<button id="' + postKey + '_delete" class="btn btn-default" onclick="clickDelete(event)" >' +
                '<i id="' + postKey + '_delete" class="fa fa-trash" onclick="clickDelete(event)" title="delete"></i>' +
                '</button>' +
                '</div>';
        }

        html = html +
            '</div>' +
            '<p id="' + postKey + '_body">' + postBody + '</p>' +
            '<img id="' + postKey + '_postImage" class="postImage" src="' + postImage + '"/>';

        if (likeStatus != null) {
            html = html +
                '<div class="postMenu">' +
                '<button class="like"><i id="' + postKey + '_like" class="fa fa-heart fa-heart-click" onclick="clickLike(event)">&nbsp;&nbsp;' + likeCount + '</i></button>' +
                '<button class="comment-btn"><i id="' + postKey + '_commentFocus" class="fa fa-comment" onclick="commentFocus(event)">&nbsp;留言</i></button>' +
                '<!--<button id="share" class="share"><i class="fa fa-share">&nbsp;分享</i></button>!-->' +
                '</div>';
        } else {
            html = html +
                '<div class="postMenu">' +
                '<button class="like"><i id="' + postKey + '_like" class="fa fa-heart" onclick="clickLike(event)">&nbsp;&nbsp;' + likeCount + '</i></button>' +
                '<button class="comment-btn"><i id="' + postKey + '_commentFocus" class="fa fa-comment" onclick="commentFocus(event)">&nbsp;留言</i></button>' +
                '<!--<button id="share" class="share"><i class="fa fa-share">&nbsp;分享</i></button>!-->' +
                '</div>';
        }

        html = html +
            '<ul id="' + postKey + '_commentList" class="comment"></ul>' +
            '<div class="msg-input"><div class="input-group">' +
            '<input id="' + postKey + '_commentBody" type="text" class="form-control" placeholder="留言...">' +
            '<span class="input-group-btn">' +
            '<button id="' + postKey + '_comment" class="btn btn-primary" onclick="writeNewComment(event)" type="button"><i class="fa fa-paper-plane fa-fw" aria-hidden="true"></i>&nbsp;發送</button>' +
            '</span>' +
            '</div></div>' +
            '</li>';

        var commentsRef = firebase.database().ref('post-comments/' + postKey);
        commentsRef.on('child_added', function (data) {
            var html = createCommentElement(data.key, data.val().userId, data.val().userName, data.val().userImage, data.val().commentBody, data.val().commentTime);
            $('#' + postKey + '_commentList').append(html);
        });

        var likeCountRef = firebase.database().ref('posts/' + postKey + '/likeCount');
        likeCountRef.on('value', function (snapshot) {
            $('i#' + postKey + '_like').html('&nbsp;&nbsp;' + snapshot.val());
        });

        var likeStatusRef = firebase.database().ref('posts/' + postKey + '/likes/' + currentUserId);
        likeStatusRef.on('value', function (snapshot) {
            if (snapshot.val() != null) {
                $('i#' + postKey + '_like').attr("class", "fa fa-heart fa-heart-click");
            } else {
                $('i#' + postKey + '_like').attr("class", "fa fa-heart");
            }
        });

        listeningFirebaseRefs.push(commentsRef);
        listeningFirebaseRefs.push(likeCountRef);
        listeningFirebaseRefs.push(likeStatusRef);

        return html;
    }

    function createCommentElement(commentKey, userId, userName, userImage, commentBody, commentTime) {
        var date = new Date(parseInt(commentTime));
        var html =
            '<li id =' + commentKey + '><a href="/profile?u=' + userId + '" >' + userName + '</a><span>' + commentBody + '</span></li>';
        return html;
    }

    function showAdvertisment() {
        var advertsRef = firebase.database().ref('adverts').limitToLast(2);
        advertsRef.once('value', function (snapshot) {
            var array = [];
            snapshot.forEach(function (data) {
                var html =
                    '<li id="' + data.key + '">' +
                    '<a id="' + data.key + '_advertisment" target="_blank" href="' + data.val().sponsorUrl + '" onclick="clickAdvert(event)">' +
                    '<div class="info">' +
                    '<img id="' + data.key + '_userImage" src="' + data.val().sponsorImage + '" class="img-circle" width="25px" height="25px">' +
                    '<h2 id="' + data.key + '_userName">' + data.val().sponsorName + '</h2>' +
                    '<span id="' + data.key + '_postTime" class="time">sponsor</span>' +
                    '</div>' +
                    '<p id="' + data.key + '_body">' + data.val().postBody + '</p>' +
                    '<img id="' + data.key + '_postImage" class="postImage" src="' + data.val().postImage + '"/>' +
                    '</a>' +
                    '</li>';

                array.push(html);
            });

            for (var i = 1; i <= array.length; i++) {
                $("#list li:nth-child(" + (5 * i - 1) + ")").after(array[i - 1]);
            }

            loadMorePost();
        });
    }

    $("#img_input").on('click', function () {
        $('#file').trigger('click');
    });

    $("#file").on("change", function (event) {
        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // 讀取檔案
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
    });

    $('#clearNewPost').on('click', function (event) {
        event.preventDefault();
        $('#newPost_body').val("");
        $("#img_preview").empty();
        newImageFile = null;
    });

    $('#userInfo').on('click', function (event) {
        event.preventDefault();
        window.location.href = "/profile?u=" + currentUserId;
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

    window.sendUpdate = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -5);
        var postBody = $('#' + postKey + '_newBody').val();

        var updates = {};
        updates['/posts/' + postKey + '/postBody'] = postBody;
        firebase.database().ref().update(updates);

        $('#' + postKey + '_operate').html(
            '<button id="' + postKey + '_update" class="btn btn-default" onclick="clickUpdate(event)" >' +
            '<i id="' + postKey + '_update" class="fa fa-pencil" onclick="clickUpdate(event)" title="edit"></i>' +
            '</button>&nbsp;' +
            '<button id="' + postKey + '_delete" class="btn btn-default" onclick="clickDelete(event)" >' +
            '<i id="' + postKey + '_delete" class="fa fa-trash" onclick="clickDelete(event)" title="delete"></i>' +
            '</button>'
        );

        $('#' + postKey + '_body').html(postBody);
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
                deletes['/post-comments/' + postKey] = null;
                deletes['/users/' + currentUserId + '/userPost/' + postKey] = null;
                firebase.database().ref().update(deletes);
                swal("已刪除", "留言已經成功刪除", "success");
                firebase.database().ref('/users/' + currentUserId + '/userPostCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
                firebase.database().ref('statistic/' + timeArray[0] + '-' + timeArray[1] + '/postCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });

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
            userId: currentUserId,
            userName: userName,
            userImage: userImage,
            commentBody: commentBody,
            commentTime: commentTime
        };

        var updates = {};
        updates['/post-comments/' + postKey + '/' + newCommentKey] = commentData;
        firebase.database().ref().update(updates);
        $('#' + postKey + '_commentBody').val("");
    }

    window.clickLike = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -5);
        firebase.database().ref('posts/' + postKey + '/likes/' + currentUserId).once("value", function (snapshot) {
            if (snapshot.val() != null) {
                var deletes = {};
                deletes['posts/' + postKey + '/likes/' + currentUserId] = null;
                firebase.database().ref().update(deletes);
                firebase.database().ref('/posts/' + postKey + '/' + 'likeCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
            } else {
                var updates = {};
                updates['posts/' + postKey + '/likes/' + currentUserId] = userName;
                firebase.database().ref().update(updates);
                firebase.database().ref('/posts/' + postKey + '/' + 'likeCount').transaction(function (currentCount) {
                    return currentCount + 1;
                });
            }
        });
    }

    window.commentFocus = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -13);
        $('#' + postKey + '_commentBody').trigger("focus");
    }

    window.clickAdvert = function (event) {
        var advertKey = event.target.id.slice(0, -13);
        firebase.database().ref('adverts/' + advertKey + '/clicks/' + currentUserId).once("value", function (snapshot) {
            if (snapshot.val() == null) {
                var updates = {};
                updates['adverts/' + advertKey + '/clicks/' + currentUserId] = true;
                firebase.database().ref().update(updates);
                firebase.database().ref('/adverts/' + advertKey + '/' + 'clickCount').transaction(function (currentCount) {
                    return currentCount + 1;
                });
            }
        });
    }

    function loadMorePost() {
        var bottomHeight = 7150;
        $(window).scroll(function () {
            if ($(this).scrollTop() >= bottomHeight) {
                alert("到達底部了");
            }
        });
    }


});