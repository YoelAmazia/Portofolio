function deleteData(id = false, data = false) {

    let msg = `Are you sure you want to delete?`
    if(id) {
        let dialogBox = dialog.showMessageBoxSync({
            type: 'question',
            title: 'Delete records',
            buttons: ['No','Yes'],
            defaultId: [0,1],
            message: msg
        })
        if(dialogBox === 0) {
            $('input.data-checkbox').prop("checked", false)
            $('tbody#data tr').removeClass('blocked')
        } else {
            deleteRecord(id)
        }
    }
}
exportData = (ext) => {
    let array_ids = []
    $('input.data-checkbox:checked').each(function(){
        let ids = $(this).attr('id')
        array_ids.push(ids)
    })
    let filePath = dialog.showSaveDialogSync({
        title: 'Export Data',
        filters: [
            {name: ext, extension: [ext]}
        ]
    })
    if(filePath != undefined){
        if(array_ids.length < 1){
            executeExport(filePath,ext)
        }else{
            let join_ids = array_ids.join(",")
            executeExport(filePath, ext, join_ids)
        }
    }else{
        console.log("ada sing salah")
    }
}

executeExport = (filePath, ext, join_ids = false) => {
    switch(ext){
        case 'csv':
            exportCsv(filePath, ext, join_ids);
            break;
        case 'pdf':
            exportPdf(filePath, ext, join_ids );
            break;
    }
}

exportCsv = (filePath, ext, join_ids = false) => {
    let doc_id = $('body').attr('id')
    switch(doc_id){
        case 'product-data':
            exportCsvPrdData(filePath, ext, join_ids);
            break;
    }
}

exportPdf = (filePath, ext, joinIds = false) => {
    let doc_id = $('body').attr('id')
    switch(doc_id) {
        case 'product-data':
            exportPdfPrdData(filePath, ext, joinIds);
            break;
        case 'sales-report':
            exportPdfSalesReport(filePath, ext, joinIds)
            break;
    }
}


printData = () => {
    let array_ids = []
    $('input.data-checkbox:checked').each(function() {
        let ids = $(this).attr('id')
        array_ids.push(ids)
    })

    if(array_ids.length < 1) {
        executePrintData()
    } else {
        let joinArrayIds = array_ids.join(",")
        executePrintData(joinArrayIds)
    }
}

executePrintData = (join_ids = false) => {

    let doc_id = $('body').attr('id')
    switch(doc_id) {
        case 'product-data':
            printPrdData(join_ids);
            break;
        case 'sales-report':
            printSalesReport(join_ids);
            break;
    }
}