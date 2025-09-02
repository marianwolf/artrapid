var imageProcess = (function () {
	function stringify() {
		var origImageFileName = 'image.jpg';
        var sanitizedFileName = 'image.jpg';
		var cropImageFileName = 'image_crop.png';
		var svgFileName = 'image_knit.svg';
		var csvFileName = 'image.csv';
		var origImageVersionId, cropImageVersionId, svgVersionId, csvVersionId;
		var isDefaultImage = true;
        var isUploadInProgress = false;
		var processed = new Object();
		var topLeftX, topLeftY, cropDia, brightness = 1, contrast = 1, invert = false;
		var userLoggedIn = false, userId = 0;
		var processReminder = false, pulseColor = false, pulseThreadHandle;
		var wallColor = '#FFFFFF', frameColor = '#C6C6C6', stringColor = '#000000';
		var artColor = '#355C7D', rapidColor = '#363636', logo = 'dark';
		var logoSVG = document.getElementById('logoSVG').innerHTML;
		var knit = document.getElementById('knit');
		var png = document.getElementById('pngKnit');
		var negative = document.getElementById('negative');
		var addCustomButton = document.getElementById('addCustomButton');
		var addCustomA = document.getElementById('addCustomA');
		var pathArray = knit.contentDocument.getElementsByTagName('path');
		var maxStrings = 4000;
		var uploadCroppie = new Croppie(document.getElementById('upload'), {
			viewport: { width: 200, height: 200, type: 'circle' },
			boundary: { width: 300, height: 300 },
			maxZoom: 1.0,
			enableExif: true,
			enableOrientation: true
		});
		knit.contentDocument.getElementById('AllSVG').insertAdjacentHTML('beforeend', logoSVG);
		uploadCroppie.bind({ url: artrapid.image_dir+'pixabay-2190682.jpg' }).then(function () {
			document.getElementById('brightnessSlider').value = 1;
			document.getElementById('contrastSlider').value = 1;
			document.getElementsByClassName('cr-image')[0].style.filter = 'grayscale(1.0) brightness(1.0) contrast(1.0)';
			document.getElementById('upload').addEventListener('update', event => { setImageFilter() }); 
			getCropVars();
			processed.topLeftX = topLeftX;
   			processed.topLeftY = topLeftY;
   			processed.cropDia = cropDia;
   			processed.invert = invert;
   			processed.brightness = brightness;
			processed.contrast = contrast;
		});
		jQuery('a[href^="#custom"]').on('click',function (e) {
			e.preventDefault();
			document.getElementById("custom").scrollIntoView({behavior: "smooth", block: "start"});
		});
		jQuery('#wall').spectrum({
			showButtons: false,
			replacerClassName: 'colorWrapper circleShadow',
			hide: function(color) {
				wallColor = color.toHexString();
				knit.contentDocument.getElementById('wall').style.fill = wallColor;
				logoColor();
				svg2png();
			}
		});
		jQuery('.frame').click(function (event) {
			frameColor = event.target.value;
			document.getElementById('frameWrapper').style.backgroundColor = frameColor;
			jQuery.modal.close();
			knit.contentDocument.getElementById('frame').style.stroke = frameColor;
			svg2png();
		});
		jQuery('.strings').click(function (event) {
			stringColor = event.target.value;
			document.getElementById('stringsWrapper').style.backgroundColor = stringColor;
			jQuery.modal.close();
			knit.contentDocument.getElementById('strings').style.stroke = stringColor;
			svg2png();
		});
		document.getElementById('strings').addEventListener('click', function () {
			document.getElementById('resolutionChooser').style.display = 'none';
			jQuery('#stringsModal').modal();
		});
		document.getElementById('frame').addEventListener('click', function (event) {
			document.getElementById('resolutionChooser').style.display = 'none';
			jQuery('#frameModal').modal();
		});
		jQuery('#customInstructionsModal').on(jQuery.modal.AFTER_CLOSE, function(event, modal) {
			document.getElementById('uploadLabel').style.display = '';
			document.getElementById('processLabel').style.display = '';
		});
		jQuery('#stringsModal').on(jQuery.modal.AFTER_CLOSE, function(event, modal) { document.getElementById('resolutionChooser').style.display = ''; });
		jQuery('#frameModal').on(jQuery.modal.AFTER_CLOSE, function(event, modal) { document.getElementById('resolutionChooser').style.display = ''; });
		jQuery('#privacyModal').on(jQuery.modal.AFTER_CLOSE, function(event, modal) { document.getElementById('resolutionChooser').style.display = ''; });
		document.getElementById('brightnessSlider').addEventListener('input', function () {	setImageFilter() });
		document.getElementById('brightnessDecrease').addEventListener('click', function () {
			document.getElementById('brightnessSlider').value -= 0.1;
			setImageFilter();
		});
		document.getElementById('brightnessIncrease').addEventListener('click', function () {
			document.getElementById('brightnessSlider').value -= -0.1;
			setImageFilter();
		});
		document.getElementById('contrastSlider').addEventListener('input', function () {
			setImageFilter();
		});
		document.getElementById('contrastDecrease').addEventListener('click', function () {
			document.getElementById('contrastSlider').value -= 0.1;
			setImageFilter();
		});
		document.getElementById('contrastIncrease').addEventListener('click', function () {
			document.getElementById('contrastSlider').value -= -0.1;
			setImageFilter();
		});
		document.getElementById('negativeDiv').addEventListener('click', function () {
			if (invert) {
				invert = false;
				negative.src = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22459%22%20height%3D%22459%22%3E%3Cpath%20d%3D%22M357%20229.5c0-71.4-56.1-127.5-127.5-127.5v255c71.4%200%20127.5-56.1%20127.5-127.5zM408%200H51C22.95%200%200%2022.95%200%2051v357c0%2028.05%2022.95%2051%2051%2051h357c28.05%200%2051-22.95%2051-51V51c0-28.05-22.95-51-51-51zm0%20408H229.5v-51C158.1%20357%20102%20300.9%20102%20229.5S158.1%20102%20229.5%20102V51H408v357z%22%2F%3E%3C%2Fsvg%3E';
			} else {
				invert = true;
				negative.src = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22459%22%20height%3D%22459%22%3E%3Cpath%20d%3D%22M102%20229.5c0-71.4%2056.1-127.5%20127.5-127.5v255C158.1%20357%20102%20300.9%20102%20229.5zM51%200h357c28.05%200%2051%2022.95%2051%2051v357c0%2028.05-22.95%2051-51%2051H51c-28.05%200-51-22.95-51-51V51C0%2022.95%2022.95%200%2051%200zm0%20408h178.5v-51c71.4%200%20127.5-56.1%20127.5-127.5S300.9%20102%20229.5%20102V51H51z%22%2F%3E%3C%2Fsvg%3E';
			};
			setImageFilter();
		});
		document.getElementById('questionDiv').addEventListener('click', function () {
			document.getElementById('uploadLabel').style.display = 'none';
			document.getElementById('processLabel').style.display = 'none';
			jQuery('#customInstructionsModal').modal();
		});
		jQuery('#fileUpload').roundSlider({
			sliderType: 'min-range',
			radius: 50,
			showTooltip: false,
			editableTooltip: false,
			readOnly: true,
			value: 100,
			handleSize: '-18'
		});
		document.getElementById('uploadFile').addEventListener('change', function () { readFile(this) });
		jQuery('#processImg').roundSlider({
			sliderType: 'min-range',
			radius: 50,
			showTooltip: false,
			editableTooltip: false,
			readOnly: true,
			value: 100,
			handleSize: '-18'
		});
		addCustomButton.addEventListener('click', function () {
			jQuery.post(artrapid.ajax_url, { action: 'get_user_id', security: artrapid.ajax_nonce },
				function (data) {
					userLoggedIn = data.userLoggedIn;
					userId = data.userId;
					if (userLoggedIn) {
						createProduct();
					} else {
						document.getElementById('resolutionChooser').style.display = 'none';
						jQuery('#privacyModal').modal();
					}
				},
				'json');
		});
		document.getElementById('guest').addEventListener('click', function () { jQuery.modal.close(); createProduct() });
		document.getElementById('account').addEventListener('click', function () { jQuery.modal.close(); window.open('/my-account/', '_blank'); });
		document.getElementById('process').addEventListener('click', function () {
			clearProcessReminder();
			document.getElementById('uploadFile').disabled = true;
			document.getElementById('uploadLabel').style.cursor = 'not-allowed';
			jQuery('#processImg .rs-bg-color').css('filter', 'grayscale(1) brightness(1.75)');
			processprogress = 0;
			jQuery('#processImg').roundSlider('option', 'value', processprogress);
			var lambdaProgress = setInterval(function () {
				processprogress += 100 / 38;
				jQuery('#processImg').roundSlider('option', 'value', processprogress);
			}, 500);
			jQuery.post(artrapid.ajax_url, {
				action: 'handle_cropped_image',
				module: 'Knit17',
				topLeftX: topLeftX,
				topLeftY: topLeftY,
				cropDia: cropDia,
				defaultImage: isDefaultImage,
                origImageFileName: sanitizedFileName,
				origImageVersionId: origImageVersionId,
				invert: invert,
				brightness: brightness,
				contrast: contrast,
				pins: 300,
				strings: 4000,
				frameThickness: 20,
				security: artrapid.ajax_nonce
			}, function (data) {
				knit.addEventListener('load', svgLoadFunction);
				var svgUrl = URL.createObjectURL(new Blob([data.svg], {'type':'image/svg+xml'}));
				knit.setAttribute('data', svgUrl);
				csvFileName = data.csvFileName;
				csvVersionId = data.csvVersionID;
				cropImageFileName = data.cropFileName;
				cropImageVersionId = data.cropVersionID;
				svgFileName = data.svgFileName;
				svgVersionId = data.svgVersionID;
				addCustomButton.disabled = false;
				document.getElementById('uploadFile').disabled = false;
				document.getElementById('uploadLabel').style.cursor = 'pointer';
				jQuery('#processImg .rs-bg-color').css('filter', 'none');
				clearInterval(lambdaProgress);
				jQuery('#processImg').roundSlider('option', 'value', 100);
				processed.topLeftX = topLeftX;
    			processed.topLeftY = topLeftY;
    			processed.cropDia = cropDia;
    			processed.invert = invert;
    			processed.brightness = brightness;
    			processed.contrast = contrast;
			}, 'json');
		});
		jQuery('#resolutionChooser').roundSlider({
			sliderType: 'min-range',
			mouseScrollAction: true,
			handleSize: '+15',
			handleShape: 'dot',
			radius: 50,
			value: Math.min(2500, maxStrings),
			max: maxStrings,
			change: function (e) { hideStrings(); }
		});
		hideStrings();
		function padStr(i) { return (i < 10) ? "0" + i : "" + i; }
		function svgLoadFunction() {
			pathArray = knit.contentDocument.getElementsByTagName('path');
			maxStrings = pathArray.length;
			jQuery('#resolutionChooser').roundSlider('option','value',Math.min(2500, maxStrings));
			jQuery('#resolutionChooser').roundSlider('option','max',maxStrings);
			knit.contentDocument.getElementById('strings').style.stroke = stringColor;
			knit.contentDocument.getElementById('frame').style.stroke = frameColor;
			knit.contentDocument.getElementById('wall').style.fill = wallColor;
			knit.contentDocument.getElementById('AllSVG').insertAdjacentHTML('beforeend', logoSVG);
			logoColor();
			hideStrings();
		};
		function setImageFilter() {
			getCropVars();
			var filterString = 'grayscale(1.0) brightness(' + brightness + ') contrast(' + contrast + ')';
			if (invert) { filterString += ' invert(1.0)' };
			document.getElementsByClassName('cr-image')[0].style.filter = filterString;
			if ((processed.topLeftX==topLeftX &&
				processed.topLeftY==topLeftY &&
				processed.cropDia==cropDia &&
				processed.invert==invert &&
				processed.brightness==brightness &&
				processed.contrast==contrast) ||	// processed and unprocessed are same
				isUploadInProgress) {               // file upload in progress
				clearProcessReminder();
			} else {
				setProcessReminder();
			}
		};
		function setProcessReminder() {
			if (!processReminder) {
				processReminder = true;
				pulseThreadHandle = setInterval(function(){
					pulseColor = !pulseColor;
					jQuery('#processImg .rs-range-color').css('background-color', pulseColor ? 'white' : '#355C7D');
				}, 1000);
				document.getElementById('process').disabled = false;
				document.getElementById('processLabel').style.cursor = 'pointer';
				jQuery('#processImg .rs-bg-color').css('filter', 'none');
			}
		};
		function clearProcessReminder(){
			clearInterval(pulseThreadHandle);
			processReminder = false;
			pulseColor = false;
			jQuery('#processImg .rs-range-color').css('background-color','#355C7D');
			document.getElementById('process').disabled = true;
			document.getElementById('processLabel').style.cursor = 'not-allowed';
		};
		function getCropVars() {
			cropVal = uploadCroppie.get();
			topLeftX = cropVal['points'][0];
			topLeftY = cropVal['points'][1];
			cropDia = cropVal['points'][2] - topLeftX - 1;
			brightness = document.getElementById('brightnessSlider').value;
			contrast = document.getElementById('contrastSlider').value;
		};
		function logoColor() {
			var colorArray = jQuery('#wall').spectrum('get').toRgb();
			var C = [colorArray['r'] / 255, colorArray['g'] / 255, colorArray['b'] / 255];
			for (var i = 0; i < 3; ++i) {
				if (C[i] <= 0.03928) { C[i] = C[i] / 12.92 } else { C[i] = Math.pow((C[i] + 0.055) / 1.055, 2.4); }
			};
			var L = 0.2126 * C[0] + 0.7152 * C[1] + 0.0722 * C[2];
			if (L > 0.179||colorArray.length==4) {
				logo = 'dark';
				artColor = '#355C7D';
				rapidColor = '#363636';
			} else {
				logo = 'light';
				artColor = '#D7D7D7';
				rapidColor = '#D7D7D7';
			};
			knit.contentDocument.getElementById('art').style.fill = artColor;
			knit.contentDocument.getElementById('rapid').style.fill = rapidColor;
		};
		function readFile(input) {
			if (input.files && input.files[0]) {
				var tempDate = new Date();
				var dateStr = padStr(tempDate.getUTCFullYear()) +
					padStr(1 + tempDate.getUTCMonth()) +
					padStr(tempDate.getUTCDate()) +
					padStr(tempDate.getUTCHours()) +
					padStr(tempDate.getUTCMinutes()) +
					padStr(tempDate.getUTCSeconds()) +
					padStr(tempDate.getUTCMilliseconds()) + '.png';
				jQuery('#fileUpload').roundSlider('option', 'value', 0);
				clearProcessReminder();
				jQuery('#processImg .rs-bg-color').css('filter', 'grayscale(1) brightness(1.75)');
				var reader = new FileReader();
				reader.onload = function (e) {
                    isUploadInProgress = true;
					uploadCroppie.bind({ url: e.target.result }).then(function () {
						document.getElementById('brightnessSlider').value = 1;
						document.getElementById('contrastSlider').value = 1;
						document.getElementsByClassName('cr-image')[0].style.filter = 'grayscale(1.0) brightness(1.0) contrast(1.0)';
						document.getElementById('uploadFile').disabled = true;
						document.getElementById('uploadLabel').style.cursor = 'not-allowed';
                        isDefaultImage = false;
						jQuery.ajax({
							xhr: function () {
								var xhr = new window.XMLHttpRequest();
								xhr.upload.addEventListener('progress', function (evt) {
									if (evt.lengthComputable) {
										var percentComplete = 100 * evt.loaded / evt.total;
										jQuery('#fileUpload').roundSlider('option', 'value', percentComplete);
									}
								}, false);
								return xhr;
							},
							type: 'POST',
							dataType: 'json',
							url: artrapid.ajax_url,
							data: {
								filename: dateStr,
								image: e.target.result,
								action: 'handle_original_image',
								security: artrapid.ajax_nonce
							},
							success: function (data) {
								document.getElementById('uploadFile').disabled = false;
								document.getElementById('uploadLabel').style.cursor = 'pointer';
								origImageVersionId = data.origImageVersionId;
								sanitizedFileName = data.sanitizedFilename;
                                isUploadInProgress = false;
								setProcessReminder();
							}
						});
						knit.removeEventListener('load', svgLoadFunction);
						var svgUrl = URL.createObjectURL(new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700"/>'], {'type':'image/svg+xml'}));
						knit.setAttribute('data', svgUrl);
						jQuery('#wall').spectrum('disable');
						document.getElementsByClassName('sp-replacer')[0].style.cursor = 'not-allowed';
						document.getElementById('frame').disabled = true;
						document.getElementById('frameWrapper').style.cursor = 'not-allowed';
						document.getElementById('strings').disabled = true;
						document.getElementById('stringsWrapper').style.cursor = 'not-allowed';
						jQuery('#resolutionChooser').roundSlider('option', 'disabled', true);
						addCustomA.style.display = 'none';
						addCustomButton.style.display = 'inline';
						addCustomButton.disabled = true;
					});
				};
				origImageFileName = input.files[0].name;
				document.getElementById('productNamePrompt').style.display = '';
				productName = origImageFileName.substring(0, origImageFileName.lastIndexOf('.'));
				document.getElementById('productName').placeholder = productName;
				reader.readAsDataURL(input.files[0]);
			}
			// else { alert("Sorry - your browser doesn't support the FileReader API");}
		};
		function hideStrings() {
			var numberStrings = jQuery('#resolutionChooser').roundSlider('option', 'value');
			var path;
			for (path = 0; path < numberStrings; path++) {
				pathArray[path].setAttribute('display', 'inline');
			};
			for (path = numberStrings; path < maxStrings; path++) {
				pathArray[path].setAttribute('display', 'none');
			};
			var basePrice = 6400;
			var pricePerString = 1.44;
			var exchangeRate = parseFloat(jQuery('.amount')[1].innerHTML.replace(/,/g,'').replace( /^\D+/g, ''))/10000;
			var customPrice = exchangeRate * (basePrice + pricePerString * numberStrings);
			var displayPrice = customPrice.toFixed(customPrice>200 ? 0 : 2);
			jQuery('#customPrice')[0].innerHTML = jQuery('.woocommerce-Price-currencySymbol')[1].innerHTML+" "+displayPrice;
			svg2png();
		};
		function svg2png() {
			var canvas = document.createElement('canvas');
			canvas.width = 700;
			canvas.height = 700;
			var context = canvas.getContext('2d');
			var img = new Image();
			img.onload = function () {
				context.drawImage(img, 0, 0);
				png.src = canvas.toDataURL('image/png');
				jQuery('#wall').spectrum('enable');
				document.getElementsByClassName('sp-replacer')[0].style.cursor = 'pointer';
				jQuery('#frame').prop('disabled', false);
				document.getElementById('frameWrapper').style.cursor = 'pointer';
				jQuery('#strings').prop('disabled', false);
				document.getElementById('stringsWrapper').style.cursor = 'pointer';
				jQuery('#resolutionChooser').roundSlider('option', 'disabled', false);
			};
			var data = encodeURIComponent(knit.contentDocument.getElementsByTagName('svg')[0].outerHTML);
			img.src = 'data:image/svg+xml,' + data;
			addCustomA.style.display = 'none';
			addCustomButton.style.display = 'inline';
			document.getElementById('productNamePrompt').style.display = '';
		};
		function createProduct() {
			addCustomButton.style.display = 'none';
			addCustomA.style.display = 'inline';
			document.getElementById('productNamePrompt').style.display = 'none';
			addCustomA.classList.remove('added');
			addCustomA.classList.add('loading');
			productName = document.getElementById('productName').value;
			if (productName.length === 0 || !productName.trim()) { productName = origImageFileName.substring(0, origImageFileName.lastIndexOf('.')) };
			jQuery.post(artrapid.ajax_url, {
				action: 'create_product',
				pins: 300,
				isCMYK: 0,
				strings: jQuery('#resolutionChooser').roundSlider('option', 'value'),
				defaultImage: isDefaultImage,
                sanitizedFileName: sanitizedFileName,
                origImageFileName: origImageFileName,
				origImageVersionId: origImageVersionId,
				cropImageFileName: cropImageFileName,
				cropImageVersionId: cropImageVersionId,
				svgFileName: svgFileName,
				svgVersionId: svgVersionId,
				csvFileName: csvFileName,
				csvVersionId: csvVersionId,
				frameColor: frameColor,
				stringColor: stringColor,
				wallColor: wallColor,
				logo: logo,
				userId: userId,
				productName: productName,
				security: artrapid.ajax_nonce
			}, function (data) {
				addCustomA.classList.remove('loading');
				jQuery('#addCustomA').data('product_id', data);
				addCustomA.setAttribute('data-product_id', data);
				addCustomA.href = '/?add-to-cart=' + data;
				addCustomA.click();
			}, 'json');
		};
	};
	return {stringify: stringify};
})();
// Full version of `log` that:
//  * Prevents errors on console methods when no console present.
//  * Exposes a global 'log' function that preserves line numbering and formatting.
(function () {
	var method;
	var noop = function () { };
	var methods = [
		'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
		'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
		'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
		'timeStamp', 'trace', 'warn'
	];
	var length = methods.length;
	var console = (window.console = window.console || {});
	while (length--) {
		method = methods[length];
		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	};
	if (Function.prototype.bind) {
		window.log = Function.prototype.bind.call(console.log, console);
	} else {
		window.log = function () {
			Function.prototype.apply.call(console.log, console, arguments);
		};
	}
})();