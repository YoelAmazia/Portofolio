let title
let inputTotalReceived
let inputTotalSales
ipcRenderer.on('load:tbody-tr', (e, content, titleBar) => {
    $('#data').html(content)
    title = titleBar
    switch(title) {
        case 'checkout' :
            $('#btn-submit').html(`<i class="fa fa-print"></i> Print`)
            inputTotalReceived = IMask(
                document.getElementById('total-received'),
                {
                    mask: 'num',
                    blocks: {
                        num: {
                            mask: Number,
                            thousandsSeparator: '.',
                            scale: 3,
                            radix: '.',
                            mapToRadix: ['.'],
                            padFractionalZeros: false,
                            signed: false
                        }
                    }
                }
            )
            inputTotalSales = IMask(
                document.getElementById('total-sales'),
                {
                    mask: 'num',
                    blocks: {
                        num: {
                            mask: Number,
                            thousandsSeparator: '.',
                            scale: 3,
                            radix: '.',
                            mapToRadix: ['.'],
                            padFractionalZeros: false,
                            signed: false
                        }
                    }
                }
            )
            break;
    }
})

submitUpdate = () => {
    switch(title) {
        case 'checkout' :
            printSales()
            break;
        default :
            submitUpdateSales()
            break;
    }
}

$('#data').on('keydown','#total-received', function(e) {
    if(e.keyCode == 13) {
        printSales()
    }
})

submitUpdateSales = () => {
    let id = []
    let input_date = []
    let sales_number = $(`.input-invoice-number`).val()
    let product_name = []
    let product_code = []
    let harga_modal = []
    let harga_jual = []
    let qty = []
    let total = []
    let values = []
    $('#data').find('.input-input-date').each(function() {
        let input_input_date = $(this).val()
        input_date.push(input_input_date)
    })
    $('#data').find('.input-product-name').each(function() {
        let input_prd_name = $(this).val()
        product_name.push(input_prd_name)
    })
    $('#data').find('.input-product-code').each(function() {
        let input_prd_code = $(this).val()
        product_code.push(input_prd_code)
    })
    $('#data').find('.input-cost-of-product').each(function() {
        let input_cost_of_product = $(this).val()
        harga_modal.push(input_cost_of_product)
    })
    $('#data').find('.input-prd-price').each(function() {
        let input_price = $(this).val()
        harga_jual.push(input_price)
    })
    $('#data').find('.input-qty').each(function() {
        let input_qty = $(this).val()
        let input_id = $(this).attr('data-id')
        qty.push(input_qty)
        id.push(input_id)
    })
    $('#data').find('.input-total').each(function() {
        let input_total = $(this).val()
        total.push(input_total)
    })
    
    for(let i=0;i<id.length;i++) {
        values.push(`('${id[i]}','${input_date[i]}','${sales_number}', '${product_name[i]}', '${product_code[i]}', '${harga_modal[i]}', '${harga_jual[i]}', '${qty[i]}','${total[i]}')`)
    }

    let joinValues = values.join(",")

    let query = `replace into sales(id, input_date, invoice_number, product_name, product_code, harga_modal, harga_jual, qty, total) values${joinValues}`
    
    db.run(query, err => {
        if(err) throw err
        ipcRenderer.send('update-success:sales-edit')
    })
}

numberFormat = (number) => {
    let numFormat = new Intl.NumberFormat('de-DE').format(number)
    return numFormat
}

cashReturn = () => {
    let total_sales = inputTotalSales.unmaskedValue
    let total_received = inputTotalReceived.unmaskedValue
    let total_returned = total_received - total_sales
    $('#info-total-returned').html(numberFormat(total_returned))
    $('#total-returned').val(total_returned)
}

printSales = () => {
    let totalSales = inputTotalSales.unmaskedValue
    let totalReceived = inputTotalReceived.unmaskedValue
    let totalReturned = totalReceived - totalSales
    ipcRenderer.send('print:sales', totalSales, totalReceived, totalReturned, 'cashier')
}