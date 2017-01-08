jQuery(document).ready(function ($) {

    var userName, userImage, currentUserId, queryName;
    var listeningFirebaseRefs = [];
    var queryId = window.location.search.substr(3);

    firebase.auth().onAuthStateChanged(function (user) {
        if (!user) {
            window.location.href = 'https://snapost.herokuapp.com/';
        } else {
            userName = user.displayName;
            userImage = user.photoURL;
            currentUserId = user.uid;
            $('#userInfo').html(
                '<img src="' + userImage + '" class="img-circle" width="30px" height="30px">&nbsp;&nbsp;' +
                '<span>' + userName + '</span>'
            );
            startDatabaseQueries();
        }
    });

    function startDatabaseQueries() {

        var profileRef = firebase.database().ref('users/' + queryId + "/");
        profileRef.on('value', function (data) {
            queryName = data.val().userName;
            var queryImage = data.val().userImage;
            $("#user_img").attr("src", queryImage);
            $('#user_name').text(queryName);
            $("#user_posts").empty();
            $("#user_fans").empty();
            $("#user_followers").empty();
            var a, b, c;

            if (data.val().userPostCount == null) {
                $("#li_post").html("<h3>0</h3><span>貼文</span>");
            } else {
                a = data.val().userPostCount;
                $("#user_posts").append(a);
            }

            if (data.val().userFanCount == null || data.val().userFanCount == 0) {
                $("#li_fans").html("<h3>0</h3><span>粉絲</span>");
            } else {
                b = data.val().userFanCount;
                $("#user_fans").append(b);
            }

            if (data.val().userFollowCount == null || data.val().userFollowCount == 0) {
                $("#li_followers").html("<h3>0</h3><span>追蹤</span>");
            } else {
                c = data.val().userFollowCount;
                $("#user_followers").append(c);
            }
        });

        var postRef = firebase.database().ref('users/' + queryId + '/userPost');
        var html = "";
        postRef.once('value', function (data) {
            data.forEach(function (childdata) {
                var postKey = childdata.key;
                var postImage = childdata.val();
                html =
                    '<li id="' + postKey + '"> ' +
                    '<a href="#" onclick="clickImg(event)"><img id="' + postKey + '_postImage" class="postImage" src="' + postImage + '"/></a>' +
                    '</li>' + html;
            });
            $("#ninebox").append("");
            $("#ninebox").append(html);
        });
        if (queryId != currentUserId) {
            $("#follow").show();
            var isFollow = firebase.database().ref('users/' + currentUserId + '/userFollow').orderByKey().equalTo(queryId);
            isFollow.once('value', function (data) {
                if (data.val() == null) {
                    $("#follow").append("加入追蹤");
                    $("#follow").val("1");
                } else {
                    $("#follow").toggleClass('btn-primary btn-default');
                    $("#follow").append("取消追蹤");
                    $("#follow").val("0");
                }
            })
        } else {
            $("#follow").remove();
        }
        //listeningFirebaseRefs.push(profileRef);
    }

    function showFan() {
        $("#result").toggle();
        $("#result").empty();
        var fanRef = firebase.database().ref('users/' + queryId + '/userFan');
        fanRef.once('value', function (data) {
            if (queryId == currentUserId) {
                data.forEach(function (childdata) {
                    var fanID = childdata.key;
                    var fanName = childdata.val();
                    var html =
                        '<li><a href="/profile?u=' + fanID + '"><p>' + fanName + '</p></a><button id="' + fanID + '_fan" class="btn btn-default btn-xs" onclick="clickUnfan(event)">移除粉絲</button></li>';
                    $("#result").append(html);
                });
            } else {
                data.forEach(function (childdata) {
                    var fanID = childdata.key;
                    var fanName = childdata.val();
                    var html = '<li><a href="/profile?u=' + fanID + '"><p>' + fanName + '</p></a></li>';
                    $("#result").append(html);
                });
            }
        });
    }

    function showFollow() {
        $("#result").toggle();
        $("#result").empty();
        var followRef = firebase.database().ref('users/' + queryId + '/userFollow');
        followRef.once('value', function (data) {
            if (queryId == currentUserId) {
                data.forEach(function (childdata) {
                    var followID = childdata.key;
                    var followName = childdata.val().userName;
                    var html =
                        '<li><a href="/profile?u=' + followID + '"><p id="' + followID + '_name_f">' + followName + '</p></a><button id="' + followID + '_f" class="btn btn-default btn-xs" onclick="clickUnFollow(event)" value="0">取消追蹤</button></li>';
                    $("#result").append(html);
                });
            } else {
                data.forEach(function (childdata) {
                    var followID = childdata.key;
                    var followName = childdata.val().userName;
                    var html = '<li><a href="/profile?u=' + followID + '"><p>' + followName + '</p></a></li>';
                    $("#result").append(html);
                });
            }
        });
    }

    function stripHTML(input) {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function createPostElement(postKey, userId, userName, userImage, postBody, postTime, postImage, likeCount) {
        var date = new Date(parseInt(postTime));
        var likeStatus;
        firebase.database().ref('posts/' + postKey + '/likes/' + currentUserId).once("value", function (snapshot) {
            likeStatus = snapshot.val();
        });

        var html =
            '<div id="' + postKey + '" class="alertPost">' +
            '<img id="' + postKey + '_postImage" class="alertPhoto" src="' + postImage + '"/>' +
<<<<<<< HEAD
            '<div class="alertContent">'  +
=======
            '<div class="alertPost">' +
>>>>>>> e2afa2ffb564b54dcc6e8c31b9316ed8515a7f25
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
            '<p id="' + postKey + '_body">' + postBody + '</p>';

        if (likeStatus != null) {
            html = html +
                '<div class="postMenu">' +
                '<button class="like"><i id="' + postKey + '_like" class="fa fa-heart fa-heart-click" onclick="clickLike(event)">&nbsp;&nbsp;' + likeCount + '</i></button>' +
                '<button class="comment-btn"><i id="' + postKey + '_commentFocus" class="fa fa-comment" onclick="commentFocus(event)">&nbsp;留言</i></button>' +
                '</div>';
        } else {
            html = html +
                '<div class="postMenu">' +
                '<button class="like"><i id="' + postKey + '_like" class="fa fa-heart" onclick="clickLike(event)">&nbsp;&nbsp;' + likeCount + '</i></button>' +
                '<button class="comment-btn"><i id="' + postKey + '_commentFocus" class="fa fa-comment" onclick="commentFocus(event)">&nbsp;留言</i></button>' +
                '</div>' +
                '</div>';
        }

        html = html +
            '<ul id="' + postKey + '_commentList" class="comment"></ul>' +
            '<div class="msg-input"><div class="input-group">' +
            '<input id="' + postKey + '_commentBody" type="text" class="form-control" placeholder="留言...">' +
            '<span class="input-group-btn">' +
            '<button id="' + postKey + '_comment" class="btn btn-primary" onclick="writeNewComment(event)" type="button"><i class="fa fa-paper-plane fa-fw" id="' + postKey + '_comment" aria-hidden="true" onclick="writeNewComment(event)"></i>&nbsp;發送</button>' +
            '</span>' +
            '</div></div>' +
            '</div></div>';

        var commentsRef = firebase.database().ref('post-comments/' + postKey);
        commentsRef.on('child_added', function (data) {
            var html = createCommentElement(postKey, data.key, data.val().userId, data.val().userName, data.val().userImage, data.val().commentBody, data.val().commentTime);
            $('#' + postKey + '_commentList').append(html);
        });
        commentsRef.on('child_removed', function (data) {
            $('#' + data.key).remove();
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

    function createCommentElement(postKey, commentKey, userId, userName, userImage, commentBody, commentTime) {
        var html = '<li id =' + commentKey + '><a href="/profile?u=' + userId + '" >' + userName + '</a><span>' + commentBody + '</span>';
        if (currentUserId == userId) {
            html = html +
                '<button id="' + postKey + '/' + commentKey + '_delete" class="delete-btn" onclick="clickCommentDelete(event)" >' +
                '<i id="' + postKey + '/' + commentKey + '_delete" class="fa fa-times" onclick="clickCommentDelete(event)" title="delete"></i>' +
                '</button>';
        }
        html = html + '</li>';
        return html;
    }

    function unFollow(i, j) {
        swal({
                title: "確定要取消追蹤？",
                text: "對方會很傷心喔 QQ",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "刪除",
                closeOnConfirm: false
            },
            function () {
                var dels = {};
                dels['/users/' + currentUserId + '/userFollow/' + i] = null;
                dels['/users/' + i + '/userFan/' + currentUserId] = null;
                firebase.database().ref().update(dels);
                firebase.database().ref('/users/' + currentUserId + '/userFollowCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
                firebase.database().ref('/users/' + i + '/userFanCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
                swal("取消追蹤", "退追蹤了啦 QQ", "success");
                changeButton(j);
            });

        $('.sweet-overlay').on('click', function (event) {
            swal.close();
        });
    }

    function doFollow(i, j) {
        var sets = {};
        var followData = {
            userName: j,
            lastPost: ""
        }
        sets['/users/' + currentUserId + '/userFollow/' + i] = followData;
        sets['/users/' + i + '/userFan/' + currentUserId] = userName;
        firebase.database().ref().update(sets);
        firebase.database().ref('/users/' + currentUserId + '/userFollowCount').transaction(function (currentCount) {
            return currentCount + 1;
        });
        firebase.database().ref('/users/' + i + '/userFanCount').transaction(function (currentCount) {
            return currentCount + 1;
        });
    }

    function changeButton(i) {
        if (i == null) {
            $("#follow").empty();
            $("#follow").toggleClass('btn-primary btn-default');
            $("#follow").append("加入追蹤");
            $("#follow").val(1);
        } else {
            $(i).empty();
            $(i).toggleClass('btn-default btn-primary');
            $(i).append("加入追蹤");
            $(i).val(1);
        }
    }

    $('#clearNewPost').on('click', function (event) {
        event.preventDefault();
        $('.form-control').val("");
        $('#newPost_body').val("");
        $("#img_preview").empty();
        newImageFile = null;
    });

    $('#userInfo').on('click', function (event) {
        event.preventDefault();
        window.location.href = "/profile?u=" + currentUserId;
    });

    $('#fans').on('click', function (event) {
        event.preventDefault();
        showFan();
    });

    $('#followers').on('click', function (event) {
        event.preventDefault();
        showFollow();
    });

    $('#searchButton').on('click', function (event) {
        event.preventDefault();
        var searchText = $('#searchText').val();
        if (searchText.match(/(^#\S+)/)) {
            window.location.href = "/search?tag=" + searchText.slice(1);
        } else {
            window.location.href = "/search?key=" + searchText;
        }
    });

    window.sendUpdate = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -5);
        var postBody = stripHTML($('#' + postKey + '_newBody').val());

        var matched = postBody.match(/(^#\S+)|(\s+#\S+)/g);
        if (matched != null) {
            [].forEach.call(matched, function (matchText) {
                var hashtagName = matchText.split("#");
                var template = '<a href="/search?tag={#n}" class="tag">{#}</a>';
                template = template.replace(/{#}/, matchText);
                template = template.replace(/{#n}/, hashtagName[1]);
                postBody = postBody.replace(matchText, template);
                var updates = {};
                updates['/hashtag/' + hashtagName[1] + '/' + postKey] = true;
                firebase.database().ref().update(updates);
                firebase.database().ref('/hashtag/' + hashtagName[1] + '/totalUsed').transaction(function (currentCount) {
                    return currentCount + 1;
                });
            });
        }

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
                title: "確認刪除貼文?",
                text: "刪除後貼文將無法復原",
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
                swal("已刪除", "貼文已經成功刪除", "success");
                firebase.database().ref('/users/' + currentUserId + '/userPostCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
                firebase.database().ref('statistic/' + timeArray[0] + '-' + timeArray[1] + '/postCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });

            });

        $(".showSweetAlert").removeClass("alertBody");
        $(".showSweetAlert").addClass("alertDelete");
        $('.sweet-overlay').on('click', function (event) {
            swal.close();
        });
    }

    window.clickCommentDelete = function (event) {
        event.preventDefault();
        var key = event.target.id.slice(0, -7);
        var splitKey = key.split('/');

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
                deletes['/post-comments/' + splitKey[0] + '/' + splitKey[1]] = null;
                firebase.database().ref().update(deletes);
                swal("已刪除", "留言已經成功刪除", "success");
            });

        $(".showSweetAlert").removeClass("alertBody");
        $(".showSweetAlert").addClass("alertDelete");
        $('.sweet-overlay').on('click', function (event) {
            swal.close();
        });
    }

    window.writeNewComment = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -8);
        var date = new Date();
        var commentTime = date.getTime();
        var commentBody = stripHTML($('#' + postKey + '_commentBody').val());
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

    window.clickfan = function (event) {
        event.preventDefault();
        if ($("#follow").val() == 1) {
            doFollow(queryId, queryName);
            $("#follow").empty();
            $("#follow").toggleClass('btn-default btn-primary');
            $("#follow").append("取消追蹤");
            $("#follow").val(0);
        } else {
            unFollow(queryId, null);
        }
    };

    window.clickUnfan = function (event) {
        event.preventDefault();
        var targetUser = event.target.id.slice(0, -4);
        var targetUserTr = "#" + targetUser + "_tr";
        swal({
                title: "確定要刪除?",
                text: "對方會很傷心喔QQ",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "刪除",
                closeOnConfirm: false
            },
            function () {
                var dels = {};
                dels['/users/' + currentUserId + '/userFan/' + targetUser] = null;
                dels['/users/' + targetUser + '/userFollow/' + currentUserId] = null;
                firebase.database().ref().update(dels);
                firebase.database().ref('/users/' + currentUserId + '/userFanCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
                firebase.database().ref('/users/' + targetUser + '/userFollowCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
                swal("刪除成功", "恭喜你少了一位粉絲", "success");
                $(targetUserTr).remove();
            });

        $('.sweet-overlay').on('click', function (event) {
            swal.close();
        });
    };

    window.clickUnFollow = function (event) {
        event.preventDefault();
        var targetUser = event.target.id.slice(0, -2);
        var a = '#' + targetUser + '_f';
        if ($(a).val() == 0) {
            unFollow(targetUser, a);
        } else {
            var p = '#' + targetUser + "_name_f";
            var targetUserName = $(p).text();
            console.log(p);
            doFollow(targetUser, targetUserName);
            $(a).empty();
            $(a).toggleClass('btn-primary btn-default');
            $(a).append("取消追蹤");
            $(a).val(0);
        }
    };

    window.clickImg = function (event) {
        event.preventDefault();
        var refKey = event.target.id.slice(0, -10);
        var postDetailRef = firebase.database().ref('posts/' + refKey + '/');
        postDetailRef.on('value', function (data) {
            var html = createPostElement(refKey, data.val().userId, data.val().userName, data.val().userImage, data.val().postBody, data.val().postTime, data.val().postImage, data.val().likeCount);
<<<<<<< HEAD
                swal({
                    title: "",
                    text: html,
                    html: true,
                    showConfirmButton: false
                });
=======
            swal({
                title: "",
                text: html,
                html: true
            });
>>>>>>> e2afa2ffb564b54dcc6e8c31b9316ed8515a7f25
            $('.sweet-overlay').on('click', function (event) {
                swal.close();
            });
            $(".showSweetAlert").addClass("alertBody");
        });
    };

    $('#searchButton').on('click', function (event) {
        event.preventDefault();
        var searchText = $('#searchText').val();
        if (searchText.match(/(^#\S+)/)) {
            window.location.href = "/search?tag=" + searchText.slice(1);
        } else {
            window.location.href = "/search?key=" + searchText;
        }
    });
})