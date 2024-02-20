
closeCashier = () => {
    ipcRenderer.send('close:cashier')
}

getProductName = () => {
    let query = `select * from products order by id desc`
    db.all(query, (err, rows) => {
        if(err) throw err
        let options = `<option value="">Nama Produk</option>`
        rows.forEach(row => {
            options+=`<option>${row.product_name}</option>`
        })
        $('#product_name').html(options)
    })
}

getProductName()

today = () => {
    let d = new Date()
    let date = d.getDate().toString().padStart(2,0)
    let month = (d.getMonth() + 1 ).toString().padStart(2,0)
    let year = d.getFullYear()
    $('#info-sales-date').html(`${date}/${month}/${year}`)
}

today()

openSales = () => {
    let sales_number = $('#sales-number').val()

    today()

    ipcRenderer.send('sales-number', sales_number)

    $('#info-sales-number').html(sales_number)
    $('#modal-new-sales').modal('hide')
    $('.sales-input').removeAttr('disabled')
    $('#btn-new-sales').prop('disabled', true)
}

let prdCodeArray = []

db.all(`select * from products`, (err, rows) => {
    if(err) throw err
    rows.map( row => {
        prdCodeArray.push(row.product_code)
    })
})

$('#product_code').autocomplete({
    source:prdCodeArray
})

getCodeByName = () => {
    let prd_name = $('#product_name').val()
    if(prd_name == "") {
        $('#product_code').val("")
    } else {
        let query = `select * from products where product_name = '${prd_name}'`
        db.all(query, (err, row) => {
            if(err) throw err
            if(row.length < 1){
                $('#product_code').val("")
            } else {
                $('#product_code').val(row[0].product_code)
            }
        })
    }
}

insertSales = () => {
    let sales_number = $('#sales-number').val()
    let product_code = $('#product_code').val().toUpperCase()

    
    if(product_code != "" && product_code != null) {
        db.all(`select * from products where product_code = '${product_code}'`, (err, row) => {
            if(err) throw err
            if(row.length < 1) {
                let alert = dialog.showMessageBoxSync(
                    {
                        title: 'Alert',
                        type: 'info',
                        message: 'tidak ada produk dengan kode '+product_code
                    }
                )
                if(alert == 0) {
                    $('#product_code').val("")
                }
            } else {
                let prd_name = row[0].product_name
                let prd_code = row[0].product_code
                let prd_price = row[0].harga_jual
                let prd_cost = row[0].harga_modal
                db.all(`select * from sales where product_code = '${prd_code}' and invoice_number = '${sales_number}'`, (err, row) => {
                    if(err) throw err
                    if(row.length < 1) {
                        let qty = 1
                        let total = qty*prd_price
                        db.run(`insert into sales (input_date, invoice_number, product_name, product_code, harga_modal, harga_jual, qty, total) values(datetime('now','localtime'), '${sales_number}', '${prd_name}', '${prd_code}', '${prd_cost}', '${prd_price}', '${qty}', '${total}')`, err => {
                            if(err) throw err
                            loadSales(sales_number)
                            $('#product_code').val("")
                            totalSales(sales_number)
                           
                        })
                    } else {
                        let qty = parseInt(row[0].qty)
                        let new_qty = qty+1
                        let new_total = parseInt(new_qty)*parseFloat(prd_price)
                        db.run(`update sales set input_date = datetime('now', 'localtime'), qty = '${new_qty}', total = '${new_total}' where product_code = '${prd_code}' and invoice_number = '${sales_number}'`, err => {
                            if(err) throw err
                            loadSales(sales_number)
                            $('#product_code').val("")
                            totalSales(sales_number)
                            
                        })
                    }
                })
            }
        })
    } else {
        dialog.showMessageBoxSync(
            {
                title: 'Alert',
                type: 'info',
                message: 'Tolong isi kode produk'
            }
        )
    }
}
loadSales = (sales_num) => {
    let query = `select * from sales where invoice_number = '${sales_num}'`
    db.all(query, (err, rows) => {
        if(err) throw err
        let tr = ''
        if(rows.length < 1) {
            tr+=''
        } else {
            rows.map( row => {
                tr += `<tr>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td><span class="float-end">${numberFormat(row.harga_jual)}</span></td>
                            <td style="text-align:center">${numberFormat(row.qty)}</td>
                            <td><span class="float-end">${numberFormat(row.total)}</span></td>
                        </tr>`
            })
        }
        $('tbody#sales-data').html(tr)
    })
}
$('#product_code, #product_name').keydown(function(e) {
    if(e.keyCode == 13) {
        insertSales()
    }
})

totalSales = (sales_number) => {
    db.all(`select sum(total) as total_sales from sales where invoice_number = '${sales_number}'`, (err, row) => {
        if(err) throw err
        let total_sales = row[0].total_sales
        $('#total-and-tax, #info-total-sales, #total-sales').html(numberFormat(total_sales))
        $('#input-total-and-tax,#total-sales').val(total_sales)
 
    })
}

salesModal = (title) => {
    let sales_number = $('#sales-number').val()
    let total_sales = $('#input-total-and-tax').val()
    if(sales_number != "") {
        db.all(`select * from sales where invoice_number = '${sales_number}'`, (err, rows) => {
            if(rows.length < 1) {
                let alert = dialog.showMessageBoxSync(
                    {
                        title: 'Alert',
                        type: 'info',
                        message: 'Tidak terdapat record penjualan yang dapat diedit, silahkan masukkan record penjualan terlebih dahulu'
                    }
                )
            } else {
                ipcRenderer.send('load:sales-modal', sales_number, title, total_sales)
				console.log(total_sales)
            }
        })
    } else {
        let alert = dialog.showMessageBoxSync(
            {
                title: 'Alert',
                type: 'info',
                message: 'Silahkan buat penjualan baru terlebih dahulu'
            }
        )
        if(alert == 0) {
            $('#btn-new-sales').focus()
        }
    }
}

ipcRenderer.on('update-success:sales-edit', () => {
    let sales_number = $('#sales-number').val()
    loadSales(sales_number)
})

