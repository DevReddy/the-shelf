$(function(){
	var getShelves  = $.getJSON('shelves.json'),
	    getProducts = $.getJSON('products.json');

	$.when(getShelves, getProducts)
	.then(function(shelves, products) {
		var shelves  = shelves[0]["shelves"],
		    products = products[0]["products"];

		initializePage(shelves, products);
		optimize();
	});
});



// Set custom handlers for adding a new product/shelf,
// toggling the form views, and re-optimizing the product data,
// then add default data from JSON files to forms.
function initializePage(shelves, products) {
	setAddListener();
	setFormToggleListener();
	setOptimizeListener();

	$(shelves).each(function() {
		addShelfInputs($(this));
	});

	$(products).each(function() {
		addProductInputs($(this));
	});
}



function optimize() {
	var products 	    = getProductInputs(),
		sortedProducts  = sort(products, 'value'),
		shelves  	    = getShelfInputs(),
		sortedShelves   = sort(shelves, 'visibility'),
		productsByShelf = {};

	// Add new "Shelf" for each shelf in the shelf form.
	$('#shelves').empty();
	$(shelves).each(function() {
		var row = $(this)[0]["row"];
		addEmptyShelfToTable(row);
	});

	// Determine which products fit on which shelves.
	// Greedy Algorithm matching highest value to highest visibility,
	// then if two products have the same value, fit smaller products
	// on shelf to maximize number of products on higher visibility shelf.
	$.each(sortedShelves, function() {
		var capacity = $(this)[0]["capacity"],
		    row 	 = $(this)[0]["row"];

		productsByShelf[row] = {};

		$.each(sortedProducts, function() {
			var name  = $(this)[0]["name"],
			    size  = $(this)[0]["size"],
			    value = $(this)[0]["value"];

			// Initialize data for each product per shelf
			productsByShelf[row][name] = {};
			productsByShelf[row][name]['quantity'] = 0;
			productsByShelf[row][name]['totalSize'] = 0;
			productsByShelf[row][name]['totalValue'] = 0;

			// While the product quantity is not 0,
			// add the product to the shelf until there is no room left.
			// Update the running count of products as it goes.
			while ($(this)[0]["quantity"] > 0) {
				if (capacity - size >= 0) {
					capacity -= size;
					productsByShelf[row][name]["quantity"] += 1;
					productsByShelf[row][name]["totalSize"] += Number(size);
					productsByShelf[row][name]["totalValue"] += Number(value);
					$(this)[0]["quantity"] -= 1;
				}
				else {
					break;
				}
			}
		});
	});

	// After optimizing products by shelf, append them in rows to the page
	displayOptimizedProducts(productsByShelf);

	// Append any leftover products to the 'leftovers' table
	displayLeftovers(sortedProducts);
}

function displayOptimizedProducts(productsByShelf) {
	$.each(productsByShelf, function(shelf, products) {
		var totalSize  = 0,
			totalValue = 0;

		// Add rows for each product's totals.
		$('#shelf-' + shelf + ' tbody').empty();
		$.each(products, function(title, props) {
			if (props["quantity"] > 0) {
				$('#shelf-' + shelf + ' tbody').append(
					'<tr>'
				  +    '<td>' + title + '</td>'
				  +    '<td>' + props["quantity"] + '</td>'
				  +    '<td>' + props["totalSize"] + '</td>'
				  +    '<td>' + props["totalValue"] + '</td>'
				  + '</tr>'
				);
				totalSize += props["totalSize"];
				totalValue += props["totalValue"];
			}
		});

		// Add row for totals of all products on shelf.
		$('#shelf-' + shelf + ' tbody').append(
			'<tr>'
		  +    '<td></td>'
		  +    '<td></td>'
		  +    '<td>' + totalSize + '</td>'
		  +    '<td>' + totalValue + '</td>'
		  + '</tr>'
		);
	});
}

function displayLeftovers(sortedProducts) {
	var noLeftovers = true;
	$('#leftovers tbody').empty();
	$.each(sortedProducts, function() {
		var name = $(this)[0]["name"];
		var quantity = $(this)[0]["quantity"];
		if (quantity > 0) {
			noLeftovers = false;
			$('#leftovers tbody').append(
				'<tr>'
			  +    '<td>' + name + '</td>'
			  +    '<td>' + quantity + '</td>'
			  + '</tr>'
			);
		}
	});
	if (noLeftovers) {
		$('#no-leftovers').show();
		$('#leftovers').hide();
	}
	else {
		$('#no-leftovers').hide();
		$('#leftovers').show();
	}
}



function getProductInputs() {
	var products = [];
	$('#product-form tbody tr').each(function() {
		var title = $(this).find('.title-field').val(),
			size = $(this).find('.size-field').val(),
			value = $(this).find('.value-field').val(),
			quantity = $(this).find('.quantity-field').val();

		products.push({
			'name': title,
			'size': size,
			'value': value,
			'quantity': quantity
		});
	});
	return products;
}

function getShelfInputs() {
	var shelves = [];
	$('#shelf-form tbody tr').each(function() {
		var row = $(this).find('.row-field').val(),
			capacity = $(this).find('.capacity-field').val(),
			visibility = $(this).find('.visibility-field').val();
		shelves.push({
			'row': row,
			'capacity': capacity,
			'visibility': visibility
		});
	});
	return shelves;
}




// -------------------
// Set Event Listeners
// -------------------

// Not as DRY as I'd like, but it will do for now.
function setAddListener() {
	$('.add-btn').off().click(function(e) {
		e.preventDefault();
		var table = $(this).parents('table');
		if (table.is('#shelf-form')){
			table.find('tbody').append(
				'<tr>'
			  +    '<td class="delete"><a href="#"><i class="fa fa-trash-o"/></a></td>'
			  +    '<td>'
			  +       '<input type="text" class="row-field" placeholder="Title">'
			  +	   '</td>'
			  +    '<td>'
			  +       '<input type="text" class="capacity-field" placeholder="Capacity">'
			  +	   '</td>'
			  +    '<td>'
			  +       '<input type="text" class="visibility-field" placeholder="Visibility">'
			  +	   '</td>'
			  + '</tr>'
			);
		}
		else if (table.is('#product-form')) {
			table.find('tbody').append(
				'<tr>'
			  +    '<td class="delete"><a href="#"><i class="fa fa-trash-o"/></a></td>'
			  +    '<td>'
			  +       '<input type="text" class="title-field" placeholder="Title">'
			  +	   '</td>'
			  +    '<td>'
			  +       '<input type="text" class="size-field" placeholder="Size">'
			  +	   '</td>'
			  +    '<td>'
			  +       '<input type="text" class="value-field" placeholder="Value">'
			  +	   '</td>'
			  +    '<td>'
			  +       '<input type="text" class="quantity-field" placeholder="Quantity">'
			  +	   '</td>'
			  + '</tr>'
			);
		}

		setDeleteListener();
	});
}

function setDeleteListener() {
	$('.delete a').off().click(function(e) {
		e.preventDefault();
		$(this).parents('tr').remove();
	});
}

function setFormToggleListener() {
	$('#form-toggle').click(function(e) {
		e.preventDefault();
		if ($(this).html() == 'Minimize Forms') {
			$('.forms').slideUp();
			$(this).html('Expand Forms');
		}
		else {
			$('.forms').slideDown();
			$(this).html('Minimize Forms');
		}
	})
}

function setOptimizeListener() {
	$('#optimize-btn').click(optimize);
}
// -------------------
// Set Event Listeners
// -------------------




// -----------------------------
// Add disgusting chunks of HTML
// -----------------------------
function addEmptyShelfToTable(row) {
	$('#shelves').append(
	       '<div class="panel panel-warning" id="shelf-' + row + '">'
	  +       '<div class="panel-heading">'
	  +          '<h3>' + row + ' Shelf</h3>'
	  +       '</div>'
	  +       '<div class="panel-body">'
	  +          '<table class="table table-striped">'
	  +             '<thead>'
	  +	   		    '<tr>'
	  +	   			   '<th>Product</th>'
	  +	   			   '<th>Quantity</th>'
	  +	   			   '<th>Total Size</th>'
	  +	   			   '<th>Total Value</th>'
	  +	   		    '</tr>'
	  +             '</thead>'
	  +             '<tbody>'
	  +             '</tbody>'
	  +             '<tfoot>'
	  +	   		    '<tr>'
	  +	   		       '<td></td>'
	  +	   		       '<td></td>'
	  +	   		       '<td class="total-size"></td>'
	  +	   		       '<td class="total-value"></td>'
	  +	   		    '</tr>'
	  +             '</tfoot>'
	  +          '</table>'
	  +       '</div>'
	  +    '</div>'
	);
}

// Again, super not DRY.
function addProductInputs(object) {
	var object = object[0];
	$('#product-form tbody').append(
		'<tr>'
	  +    '<td class="delete"><a href="#"><i class="fa fa-trash-o"/></a></td>'
	  +    '<td>'
	  +       '<input type="text" class="title-field" placeholder="Title" value="' + object['name'] + '">'
	  +	   '</td>'
	  +    '<td>'
	  +       '<input type="text" class="size-field" placeholder="Size" value="' + object['size'] + '">'
	  +	   '</td>'
	  +    '<td>'
	  +       '<input type="text" class="value-field" placeholder="Value" value="' + object['value'] + '">'
	  +	   '</td>'
	  +    '<td>'
	  +       '<input type="text" class="quantity-field" placeholder="Quantity" value="' + object['qty'] + '">'
	  +	   '</td>'
	  + '</tr>'
	);

	setDeleteListener();
}

function addShelfInputs(object) {
	var object = object[0];
	$('#shelf-form tbody').append(
		'<tr>'
	  +    '<td class="delete"><a href="#"><i class="fa fa-trash-o"/></a.</td>'
	  +    '<td>'
	  +       '<input type="text" class="row-field" placeholder="Title" value="' + object['row'] + '">'
	  +	   '</td>'
	  +    '<td>'
	  +       '<input type="text" class="capacity-field" placeholder="Capacity" value="' + object['capacity'] + '">'
	  +	   '</td>'
	  +    '<td>'
	  +       '<input type="text" class="visibility-field" placeholder="Visibility" value="' + object['visibility'] + '">'
	  +	   '</td>'
	  + '</tr>'
	);

	setDeleteListener();
}
// -----------------------------
// Add disgusting chunks of HTML
// -----------------------------




// Custom sort for array of objects
function sort (dataSet, property) {
	return dataSet.sort(function (a,b) {
		if ( a[property] > b[property] )
			return -1;
		else if ( a[property] < b[property] )
			return 1;
		else {
			if (property == 'visibility')
				return sort(dataSet, "size");
			else
				return 0;
		}
	});
}