exports.index = function (request, response) {
    response.render('pages/index');
};

exports.profile = function (request, response) {
    response.render('pages/profile');
};

exports.hashtag = function (request, response) {
    response.render('pages/hashtag');
};

exports.chart = function (request, response) {
    response.render('pages/chart');
}

exports.ad = function (request, response) {
	response.render('pages/ad');
}