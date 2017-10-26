console.log('sequelizedatatable file added');


    //console.log('Request value ###length : '+ req['query'].length);
    //console.log('Request value ###start : '+ req['query'].start);
    
    //console.log('====================================================');
    //console.log('---------------------------------------------------');
    //console.log(req.param('draw'));
    //console.log('---------------------------------------------------');
    //console.log(req.param('columns'));
    //console.log('---------------------------------------------------');
    //console.log(req.param('order'));
    //console.log('---------------------------------------------------');
    //console.log(req.param('start'));
    //console.log('---------------------------------------------------');
    //console.log(req.param('length'));    
    //console.log('---------------------------------------------------');
    //console.log(req.param('search'));    
    //console.log('---------------------------------------------------');



    var draw = req.param('draw');

    var search = req.param('search').value;
    var searchval = [];

    var attributesval = [];
    var columns = req.param('columns');
    for(var index in columns) {
        var col = columns[index];
        attributesval.push( [col.name, col.data] );

        if(col.searchable=='true') {
            var colfilter = {};
            colfilter[col.name] = { $like: '%'+search+'%' };
            searchval.push( colfilter );
        }

        //console.log('---------------------------------------------------');
        //console.log(searchval.length);
        //console.log('---------------------------------------------------');
    }
    //  Add Additional columns in the select clause
    //attributesval.push('user_group_mapping');

    if(searchval.length==0) {
        var whereval = {};
    } else {
        var whereval = { $or: searchval };
    }

    var order = req.param('order');
    var orderval = columns[order[0].column].name + ' ' + order[0].dir;

    var offsetval = req.param('start');
    //var limitval = req.param('length');
    var limitval = req.query.length;


    //console.log('====================================================');
    //console.log(attributes);
    //console.log('====================================================');
    //console.log('====================================================');
    //console.log('Whereval: ' + whereval);
    //console.log('====================================================');
    //console.log('====================================================');
    //console.log('Orderval: ' + orderval);
    //console.log('====================================================');
    //console.log('====================================================');
    //console.log('Offsetval: ' + offsetval);
    //console.log('====================================================');
    //console.log('====================================================');
    //console.log('Limitval: ' + limitval);
    //console.log('====================================================');
