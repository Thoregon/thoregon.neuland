module.exports = function blobToArrayBuffer(blob) {
	var fileReader = new FileReader();

	return new Promise(function(resolve, reject) {
		fileReader.onload = resolve;
		fileReader.onerror = reject;

		fileReader.readAsArrayBuffer(blob);
	});
};
