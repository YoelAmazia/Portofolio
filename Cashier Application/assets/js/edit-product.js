submitEditPrdData = (rowId) => {
    let prdName = $('#edit-form').find('#editPrdName').val()
    let prdPrice = $('#edit-form').find('#editPrdPrice').val()
    let prdCost = $('#edit-form').find('#editPrdCost').val()

    if(prdName === "") {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'nama produk harus diisi'
        })
    } else {
        executeEditPrdData(rowId)
    }
}

executeEditPrdData = (rowId) => {
    let prdName = $('#edit-form').find('#editPrdName').val()
    let prdPrice = $('#edit-form').find('#Harga_jual').val()
    let prdCost = $('#edit-form').find('#Harga_modal').val()

    if(prdPrice === "") {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'Harga jual harus diisi'
        })
    } else if(prdCost === "") {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'Harga pokok/beli harus diisi'
        })
    } else if(parseInt(prdPrice) < parseInt(prdCost)) {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'Harga jual berada di bawah harga pokok'
        })
    } else {

        let query = `update products set product_name = '${prdName}', Harga_jual = ${prdPrice}, Harga_modal =${prdCost} where id = ${rowId}`

        db.serialize( () => {
            db.run(query, err => {
                if(err) throw err
                ipcRenderer.send('update:success', doc_id)
            })
        })
    }
}
