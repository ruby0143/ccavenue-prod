var http = require('http'),
    fs = require('fs'),
    ccav = require('./ccavutil.js'),
    crypto = require('crypto'),
    qs = require('querystring');

exports.postRes = function(request,response){
    var ccavEncResponse='',
	ccavResponse='',	
	workingKey = '3CCCBA6E34604E7912C25E3053E2985B',	//Put in the 32-Bit key provided by CCAvenues.
	ccavPOST = '';

    //Generate Md5 hash for the key and then convert in base64 string
    var md5 = crypto.createHash('md5').update(workingKey).digest();
    var keyBase64 = Buffer.from(md5).toString('base64');

    //Initializing Vector and then convert in base64 string
    var ivBase64 = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,0x0e, 0x0f]).toString('base64');

        request.on('data', function (data) {
	    ccavEncResponse += data;
	    ccavPOST =  qs.parse(ccavEncResponse);
	    var encryption = ccavPOST.encResp;
	    ccavResponse = ccav.decrypt(encryption, keyBase64, ivBase64);
        });

	request.on('end', function () {
	    var pData = '';
	    pData = '<table border=1 cellspacing=2 cellpadding=2><tr><td>'	
	    pData = pData + ccavResponse.replace(/=/gi,'</td><td>')
	    pData = pData.replace(/&/gi,'</td></tr><tr><td>')
	    pData = pData + '</td></tr></table>'
            htmlcode = `<html lang="en"> <head> <meta charset="utf-8" /> <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" /> <meta name="viewport" content="width=device-width, initial-scale=1"> <title></title> <link href='https://fonts.googleapis.com/css?family=Lato:300,400|Montserrat:700' rel='stylesheet' type='text/css'> <style> @import url(//cdnjs.cloudflare.com/ajax/libs/normalize/3.0.1/normalize.min.css); @import url(//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css); </style> <link rel="stylesheet" href="https://2-22-4-dot-lead-pages.appspot.com/static/lp918/min/default_thank_you.css"> <script src="https://2-22-4-dot-lead-pages.appspot.com/static/lp918/min/jquery-1.9.1.min.js"></script> <script src="https://2-22-4-dot-lead-pages.appspot.com/static/lp918/min/html5shiv.js"></script> </head> <body> <header class="site-header" id="header"> <h1 class="site-header__title" data-lead-id="site-header-title">THANK YOU!</h1> </header> <div class="main-content"> <i class="fa fa-check main-content__checkmark" id="checkmark"></i> <p class="main-content__body" data-lead-id="main-content-body">Your payment was successful.</p> </div> <footer class="site-footer" id="footer"> <p class="site-footer__fineprint" id="fineprint">Copyright ©2024 | All Rights Reserved</p> </footer> </body> </html>`;
            response.writeHeader(200, {"Content-Type": "text/html"});
	    response.write(htmlcode);
	    response.end();
	}); 	
};
