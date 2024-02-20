
let inputPrdModal = IMask(
    document.getElementById('Harga_modal'),
    {
        mask: 'Rp num',
        blocks:{
            num:{
                mask: Number,
                thousandsSeparator: '.',
                scale: 3,
                radix: ',',
                mapToRadix: ['.'],
                padFractionalZeros: false,
                signed: false
            }
        }
    }
)
let inputPrdJual = IMask(
    document.getElementById('Harga_jual'),
    {
        mask: 'Rp num',
        blocks:{
            num:{
                mask: Number,
                thousandsSeparator: '.',
                scale: 3,
                radix: ',',
                mapToRadix: ['.'],
                padFractionalZeros: false,
                signed: false
            }
        }
    }
)

function loadProduct() {
    let query = 'select * from products'
    db.serialize( () => {
        db.all(query, (err, rows) => {
            if (err) throw err
            let tr = ''
            if(rows.length < 1) {
                tr += ''
            } else {
                rows.forEach((row) => {
                    tr+=`<tr data-id=${row.id}>
                            <td data-colname="Id">${row.id}</td>
                            <td>${row.product_code}</td>
                            <td>${row.product_name}</td>
                            <td>${row.harga_modal}</td>
                            <td>${row.harga_jual}</td>
                            <td>
                                <button class="btn btn-sm btn-light btn-light-bordered" onclick="editRecord(${row.id})" id="edit-data"  ><i class="fa fa-edit"></i></button>
                                <button class="btn btn-sm btn-danger" id="delete-data" onclick="deleteData(${row.id}, '${product_name}')"><i class="fa fa-trash"></i></button>
                            </td>
                        </tr>`
                })
            }
            $('tbody#data').html(tr)
        })
    })
}

insertProduct = () => {
    let prd_code = $('#product_code').val()
    let prd_name = $('#product_name').val()
    let prd_modal = inputPrdModal.unmaskedValue
    let prd_jual = inputPrdJual.unmaskedValue

    let required = $('[required]')
    let required_array = []
    required.each(function() {
        if($(this).val() != "") {
            required_array.push($(this).val())
        }
    })

    if(required_array.length < 4) {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'masih ada yang blm terisi'
        }) 
    } else if(parseInt(prd_jual) < parseInt(prd_modal)) {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'Harga jual lebih kecil dari harga modal'
        }) 
    } else(
        db.run(`insert into products(product_code, product_name, Harga_modal, Harga_jual) values('${prd_code}','${prd_name}','${prd_modal}','${prd_jual}')`, err => {
            if(err) throw err
            $('#product_name').focus()
            load_data()
            })
    )
}



editPrdData = (id) => {
    let sql = `select * from products where id = ${id}`

    db.all(sql,(err, result) => {
        if(err) {
            throw err
        } else{
            let row = result[0]
            let editForm
            editForm = `<div class="mb-3">
                            <input type="text" value="${row.product_name}" id="editPrdName" placeholder="Nama Produk" class="form-control form-control-sm">
                        </div>
                        <div class="mb-3">
                            <input type="text" value="${row.harga_jual}" placeholder="Harga Jual" id="Harga_jual" class="form-control form-control-sm">
                        </div>
                        <div class="mb-3">
                            <input type="text" value="${row.harga_modal}" placeholder="Harga Modal" id="Harga_modal" class="form-control form-control-sm">
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-sm btn-primary btn-block" onclick="submitEditPrdData(${id})"  id="button-submit-edit" ><i class="fa fa-paper-plane"></i> SUBMIT </button>
                        </div>
                        `
            ipcRenderer.send('load:edit','product-data',editForm, 300, 450, id)
        }
    })
}

ipcRenderer.on('update:success', (e, msg) => {
    alertSuccess(msg)
    load_data()
})

exportCsvPrdData = (filePath, ext, join_ids = false) => {
    let sql
    let file_path = filePath.replace(/\\/g,'/')
    if(join_ids){
        sql = `select * from products where id IN(${join_ids}) order by id desc`
    }else{
        sql = `select * from products order by id desc`
    }

    db.all(sql, (err, result) => {
        if(err) throw err
        convertToCsv = (arr) => {
            let array = [Object.keys(arr[0])].concat(arr)
            return array.map((item) => {
                return Object.values(item).toString()
            }).join('\r\n')
        }
        let content = convertToCsv(result)
        ipcRenderer.send('write:csv', file_path, content)
    })
}

exportPdfPrdData = (filePath, ext, joinIds = false) => {
    let file_path = filePath.replace(/\\/g, '/')
    let sql
    if(joinIds) {
        
        
        sql = `select * from products where id IN(${joinIds}) order by id desc`
        console.log(sql)
        
        db.all(sql, (err, res) => {
            if(err) throw err
            let tbody = ''
            let thead = `<tr>
                            <th>Id</th>
                            <th>Kode Produk</th>
                            <th>Nama Produk</th>
                            <th>Harga Jual</th>
                            <th>Harga Modal</th>
                        </tr>`
            res.forEach( (row)=>{
                tbody+=`<tr>
                            <td>${row.id}</td>
                            <td>${row.product_code}</td>
                            <td>${row.product_name}</td>
                            <td>${row.harga_modal}</td>
                            <td>${row.harga_jual}</td>
                        </tr>`
            })

            ipcRenderer.send('load:to-pdf', thead, tbody, file_path, 'product-data', 'Data Produk')
            

        })
    } else {
        sql = `select * from products order by id desc`
        db.all(sql, (err, res) => {
            if(err) throw err
            let tbody = ''
            let thead = `<tr>
                            <th>Id</th>
                            <th>Kode Produk</th>
                            <th>Nama Produk</th>
                            <th>Harga Jual</th>
                            <th>Harga Modal</th>
                        </tr>`
            res.forEach( (row)=>{
                tbody+=`<tr>
                            <td>${row.id}</td>
                            <td>${row.product_code}</td>
                            <td>${row.product_name}</td>
                            <td>${row.harga_modal}</td>
                            <td>${row.harga_jual}</td>
                        </tr>`
            })

            ipcRenderer.send('load:to-pdf', thead, tbody, file_path, 'product-data', 'Data Produk')

        })
    }
}

printPrdData = (join_ids = false) => {
    let sql
    if(join_ids) {
        sql = `select * from products where id IN(${join_ids}) order by id desc`
        db.all(sql, (err, res) => {
            if(err) throw err
            let tbody = ''
            let thead = `<tr>
                            <th>Id</th>
                            <th>Kode Produk</th>
                            <th>Nama Produk</th>
                            <th>Harga Jual</th>
                            <th>Harga Modal</th>
                        </tr>`
            res.forEach( (row)=>{
                tbody+=`<tr>
                            <td>${row.id}</td>
                            <td>${row.product_code}</td>
                            <td>${row.product_name}</td>
                            <td>${row.harga_modal}</td>
                            <td>${row.harga_jual}</td>
                        </tr>`
            })

            ipcRenderer.send('load:print-page', thead, tbody, 'product-data', 'Data Produk')

        })
    } else {
        sql = `select * from products order by id desc`
        db.all(sql, (err, res) => {
            if(err) throw err
            let tbody = ''
            let thead = `<tr>
                            <th>Id</th>
                            <th>Kode Produk</th>
                            <th>Nama Produk</th>
                            <th>Harga Jual</th>
                            <th>Harga Modal</th>
                        </tr>`
            res.forEach( (row)=>{
                tbody+=`<tr>
                            <td>${row.id}</td>
                            <td>${row.product_code}</td>
                            <td>${row.product_name}</td>
                            <td>${row.harga_modal}</td>
                            <td>${row.harga_jual}</td>
                        </tr>`
            })

            ipcRenderer.send('load:print-page', thead, tbody, 'product-data', 'Data Produk')
        
        })
    }
}