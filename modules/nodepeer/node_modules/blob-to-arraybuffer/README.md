# blob-to-arraybuffer
Promise API to turn a `Blob` into an `ArrayBuffer`

## Install

```
$ npm install --save blob-to-arraybuffer
```

## Usage

``` javascript
const blobToArrayBuffer = require("blob-to-arraybuffer");

blobToArrayBuffer(blob).then(buffer => {
	// hurrah!
});
```

### with `fetch`

``` javascript
fetch("file.dat")
.then(res => res.blob)
.then(blobToArrayBuffer)
.then(buffer => {

});
```
