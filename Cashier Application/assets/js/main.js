let doc_id = $('body').attr('id')
load_data = () => {
    switch(doc_id){
        case 'product-data' :
            loadProduct();
            break;
    }
}
load_data()

deleteRecord = (id, data) => {
    let doc_id = $('body').attr('id')
    let table
    switch (doc_id){
        case 'product-data':
            table='products'
            break;
    }
    if(id){
        let sql = `delete from ${table} where id = ${id}`
        db.run(sql, err => {
            if(err){
                console.log(err)
            }else {
                load_data()
            }
        })
    }
}


editRecord = (id) => {
    let doc_id = $('body').attr('id')
    switch (doc_id) {
        case 'product-data':
            editPrdData(id)
            break;


    }
}

alertSuccess = (msg) => {
    let div=`<div class="alert alert-success">${msg}</div>`
    $('#alert').html(div)
    clearAlert = () => {
        $('#alert').html("")
    }
    setTimeout(clearAlert,4000)
}

numberFormat = (number) => {
    let numFormat = new Intl.NumberFormat('de-DE').format(number)
    return numFormat
}