'use strict';

var adminProduct = require('../controller/productController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
 	
    app.post('/api/admin/product/list', adminProduct.getProductList); // Get List of Product
    app.post('/api/admin/product/add', adminProduct.addNewProduct); // Add New Product
    app.get('/api/admin/product/get/:id', adminProduct.getProductData); // Get Product Data ( id = Product Id )
    app.post('/api/admin/product/update/:id', adminProduct.updateProduct); // Update Product ( id = Product Id )
	app.get('/api/admin/product/list', adminProduct.getProductDataList); // Get Product List

};