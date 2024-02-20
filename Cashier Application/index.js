const {app, BrowserWindow, ipcMain, screen, webContents, dialog} = require('electron')
const path = require('path')
const db = require('./config/database/db_config')
const remote = require('@electron/remote/Main')
const fs = require('fs')
const url = require('url')
const md5 = require('md5')
const { title } = require('process')
remote.initialize()

let mainWindow 
let productWindow
let editDataModal
let toPdf
let printPage
let cashierWindow
let salesReportWindow
let loginModal
let login = false
let firstName
let userId
let position
let accessLevel
let storeObject = {}
let userSettingModal
let profilSettingModal
let salesModal
let salesNum
let printSalesPage
let configTableModal

ipcMain.on('sales-number', (e, msgSalesNumber) => {
    salesNum = msgSalesNumber
})

ipcMain.on('success:login', (e, msgUserId, msgFirstName, msgPosition, msgAccessLevel) => {
    login = true
    firstName = msgFirstName
    position = msgPosition
    userId = msgUserId
    accessLevel = msgAccessLevel
    mainWindow.webContents.send('unlock:app', storeObject, msgUserId, firstName, position, accessLevel)
    loginModal.hide()
})

ipcMain.on('submit:logout', () => {
    loginModal.show()
})

modalLogin = () => {
    loginModal = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation:false
        },
        width: 250,
        height: 180,
        parent: mainWindow,
        modal: true,
        autoHideMenuBar: true,
        frame: false,
        minimizable: false,
        maximizable: false,
        resizable: false
        
    })
    db.all(`select * from profil where id = 1 order by id asc`, (err, row) => {
        if(err) throw err
        storeObject.name = row[0].store_name
        storeObject.logo = row[0].logo
    })
    loginModal.loadFile('windows/login.html')
    remote.enable(loginModal.webContents)
    loginModal.webContents.on('did-finish-load', () => {
        loginModal.focus()
    })
}

modalTableConfig = () => {
    configTableModal = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation:false
        },
        width: 300,
        height: 150,
        parent: mainWindow,
        modal: true,
        autoHideMenuBar: true,
        frame: false,
        minimizable: false,
        maximizable: false,
        resizable: false
    })
    configTableModal.loadFile('windows/config-table.html')
    configTableModal.on('close', (e) => {
        e.preventDefault()
    })
    configTableModal.on('minimize', (e) => {
        e.preventDefault()
    })
    configTableModal.on('maximize', (e) => {
        e.preventDefault()
    })
}

mainWin = () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: false,
        height: 550,
        resizable: true,
        title: 'Kasir Nasi Goreng Bu Siti',
        frame: false
    });

    mainWindow.loadFile('index.html');
    mainWindow.setFullScreen(true)
    db.all(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`, (err, rows) => {
        if (rows.length < 1) {
            mainWindow.webContents.on('did-finish-load', () => {
                mainWindow.webContents.send('load:overlay', storeObject);
            });
            modalTableConfig();
            db.run(`CREATE TABLE profil (id INTEGER PRIMARY KEY, store_name VARCHAR(150), store_address VARCHAR(150), phone_number VARCHAR(150))`, err => {
                if (err) throw err;
                db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(100) NOT NULL, password VARCHAR(100) NOT NULL, access_level VARCHAR(100) NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, position VARCHAR(100), phone_number VARCHAR(12), employee_number VARCHAR(50), status VARCHAR(20))`, err => {
                    if (err) throw err;
                    db.run(`CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, product_code VARCHAR(200), image VARCHAR(200), product_name VARCHAR(200) NOT NULL UNIQUE, harga_modal REAL, harga_jual REAL, CHECK(harga_modal <= harga_jual))`, err => {
                        if (err) throw err;
                        db.run(`CREATE TABLE sales (id INTEGER PRIMARY KEY AUTOINCREMENT, input_date TEXT, invoice_number VARCHAR(100), product_name VARCHAR(200) NOT NULL, product_code VARCHAR(200) NOT NULL, harga_modal REAL, harga_jual REAL, qty INTEGER, total REAL)`, err => {
                            if (err) throw err;
                            db.run(`CREATE TABLE bukti (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_number VARCHAR(100), print_status VARCHAR(15))`, err => {
                                if (err) throw err;
                                db.run(`INSERT INTO profil (store_name, store_address, phone_number) VALUES ('Nasi Goreng Bu Siti', 'Jl. Gergaji Pelem, Mugassari, Kec. Semarang Sel., Kota Semarang, Jawa Tengah 50249', '087746352678')`, err => {
                                    if (err) throw err;
                                    db.run(`INSERT INTO users (username, password, access_level, first_name, last_name) VALUES ('admin', 'admin123', 'main_user', 'admin', 'satu')`, err => {
                                        if (err) throw err;
                                         finilizeTableConfig = () => {
                                            configTableModal.hide();
                                            modalLogin();
                                        };
                                        setTimeout(finilizeTableConfig, 2000);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }  else {
            if(!login) {
                db.all(`select * from profil where id = 1 order by id asc`, (err, row) => {
                    if(err) throw err
                    storeObject.name = row[0].store_name
                })
                mainWindow.webContents.on('did-finish-load', () => {
                    mainWindow.webContents.send('load:overlay', storeObject)
                })
                modalLogin()
            }
        }
    })
}




ipcMain.on('window:minimize', () => {
    mainWindow.minimize()
})

ipcMain.on('window:close', () => {
    app.quit()
})

app.on('ready', () => {
    mainWin()
})

ipcMain.on('close:app', () => {
    app.quit()
})

ipcMain.on('load:product-window', () => {
    productWin()
})

productWin = () => {

    const {width, height} = screen.getPrimaryDisplay().workAreaSize

    productWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: false,
        width: width,
        height: height,
        title: 'Data Produk'
    })
    
    remote.enable(productWindow.webContents)
    // productWindow.setFullScreen(true)
    productWindow.loadFile('windows/product.html')
    productWindow.webContents.on('did-finish-load', () => {
        mainWindow.hide()
    })

    productWindow.on('close', () => {
        mainWindow.show()
    })
}

editData = (docId, modalForm, modalWidth, modalHeight, rowId) => {
    let parentWin
    switch (docId) {
        case 'product-data':
            parentWin = productWindow
            break;
    }
    editDataModal = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
            
        },
        width: modalWidth,
        height: modalHeight,
        resizable: false,
        maximizable: false,
        minimizable: false,
        parent: parentWin,
        modal: true,
        title: 'Edit Data',
        autoHideMenuBar: true
    })
    remote.enable(editDataModal.webContents)
    editDataModal.loadFile('windows/edit-data.html')
    editDataModal.webContents.on('did-finish-load', () => {
        editDataModal.webContents.send('res:form', docId, modalForm, rowId)
    })
    editDataModal.on('close', () => {
        editDataModal = null
    })
}

ipcMain.on('load:edit', (event, msgDocId, msgForm, msgWidth, msgHeight, msgRowId) => {
    editData(msgDocId, msgForm, msgWidth, msgHeight, msgRowId)
})

ipcMain.on('update:success', (e, msgDocId) => {
    switch(msgDocId){
        case 'product-data':
            productWindow.webContents.send('update:success','sukses mengupdate data')
    }
    editDataModal.close()
})

writeCsv = (path, content) =>{
    fs.writeFile(path, content, err => {
        if(err) throw er
        dialog.showMessageBoxSync({
            title: 'Alert',
            type:'info',
            message: 'csv file sudah dibuat'
        })
    })
}

ipcMain.on('write:csv', (e, msgPath, msgContent) => {
    writeCsv(msgPath, msgContent)
})

loadToPdf = (param1, param2, file_path, totalSales = false, docId = false, title) => {
    toPdf = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show:false
    })

    let totalObject
    if(totalSales) {
        totalObject = totalSales
    } else {
        totalObject = ''
    }

    let d = new Date()
    let day = d.getDate().toString().padStart(2,0)
    let month = d.getMonth().toString().padStart(2,0)
    let year = d.getFullYear()
    let today = `${day}/${month}/${year}`

    titleObject = {
        title: title,
        date: today
    }

    db.all(`select * from profil order by id asc limit 1`, (err, row) => {
        if(err) throw err
        if(row.length < 1) {
            titleObject.storeName = 'My Store',
            titleObject.storeAddress = 'Address',
            titleObject.storeLogo = 'shop.png'
        } else {
            titleObject.storeName = row[0].store_name
            titleObject.storeAddress = row[0].store_address
            if(row[0].logo == null || row[0].logo == "") {
                titleObject.storeLogo = 'shop.png'
            } else {
                titleObject.storeLogo = row[0].logo
            }
        }
    })

    switch(docId) {
        case 'sales-report':
            toPdf.loadFile('windows/reportPdf.html');
            break;
        default :
            toPdf.loadFile('windows/toPdf.html')
    }

    toPdf.webContents.on('dom-ready', () => {
        toPdf.webContents.send('load:table-to-pdf', param1, param2, totalObject, titleObject, file_path)
    })



}

ipcMain.on('load:to-pdf', (e, msgThead, msgTbody, msgFilePath, msgTotalSales,  msgDocId, msgTitle) => {
    loadToPdf(msgThead, msgTbody, msgFilePath, msgTotalSales, msgDocId, msgTitle)
})

ipcMain.on('create:pdf', (e, file_path) => {
    toPdf.webContents.printToPDF({
        marginsType: 0,
        printBackground: true,
        printSelectionOnly: false,
        landscape: true
    }).then( data => {
        fs.writeFile(file_path, data, err => {
            if(err) throw err
            toPdf.close()
            dialog.showMessageBoxSync({
                title: 'Alert',
                type: 'info',
                message: 'Successfully export data to PDF'
            })
        })
    }).catch( error => {
        console.log(error)
    })
})


loadPrintPage = (param1, param2, docId = false, title) => {
    printPage = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    
    let d = new Date()
    let day = d.getDate().toString().padStart(2,0)
    let month = d.getMonth().toString().padStart(2,0)
    let year = d.getFullYear()
    let today = `${day}/${month}/${year}`

    titleObject = {
        title: title,
        date: today
    }

    db.all(`select * from profil order by id asc limit 1`, (err, row) => {
        if(err) throw err
        if(row.length < 1) {
            titleObject.storeName = 'My Store',
            titleObject.storeAddress = 'Address',
            titleObject.storeLogo = 'shop.png'
        } else {
            titleObject.storeName = row[0].store_name
            titleObject.storeAddress = row[0].store_addres
            if(row[0].logo == null || row[0].logo == "") {
                titleObject.storeLogo = 'shop.png'
            } else {
                titleObject.storeLogo = row[0].logo
            }
        }
    })

    switch(docId) {
        case 'sales-report':
            printPage.loadFile('windows/sales-record-pdf.html');
            break;
        default :
            printPage.loadFile('windows/print.html')
    }

    printPage.webContents.on('dom-ready', () => {
        printPage.webContents.send('load:table-to-print', param1, param2, titleObject)
    })

}

ipcMain.on('load:print-page', (e, msgThead, msgTbody, msgDocId, msgTitle) => {
    loadPrintPage(msgThead, msgTbody, msgDocId, msgTitle)
    
})

ipcMain.on('print:page', () => {
    printPage.webContents.print({
        printBackground: true
    }, () => {
        printPage.close()
    })
    printPage.on('close', () => {
        printPage = null
    })
})

cashierWin = () => {
    cashierWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        width: 1200,
        height: 720,
        title: 'Cashier'
    })

    cashierWindow.loadFile('windows/cashier.html')

    cashierWindow.setFullScreen(true)
    remote.enable(cashierWindow.webContents)
    cashierWindow.webContents.on('did-finish-load', () => {
        mainWindow.hide()
    })

    cashierWindow.on('close', () => {
        mainWindow.show()
    })
}

ipcMain.on('load:cashier-window', () => {
    cashierWin()
})

ipcMain.on('close:cashier', () => {
    cashierWindow.close()
})

salesReportWin = () => {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize
    salesReportWindow = new BrowserWindow(
        {
            webPreferences:
            {
                nodeIntegration: true,
                contextIsolation: false
            },
            autoHideMenuBar: true,
            width: width,
            height: height,
            title: 'Laporan Penjualan'
        }
    )
    remote.enable(salesReportWindow.webContents)
    // salesReportWindow.setFullScreen(true)
    salesReportWindow.loadFile('windows/sales-report.html')
    salesReportWindow.webContents.on('did-finish-load', () => {
        mainWindow.hide()
    })
    salesReportWindow.on('close', () => {
        mainWindow.show()
    })
}
ipcMain.on('load:sales-report-window', () => {
    salesReportWin()
})

modalUserSetting = () => {
    userSettingModal = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            autoHideMenuBar: true,
            title: 'Pengaturan Admin',
            parent: mainWindow,
            modal: true,
            width: 500,
            height: 540,
            resizable: false,
            minimizable: false
        }
    ) 
    remote.enable(userSettingModal.webContents)
    userSettingModal.loadFile('windows/user.html')
    userSettingModal.webContents.on('dom-ready', () => {
        userSettingModal.webContents.send('load:data', userId, accessLevel)
    })
}
ipcMain.on('load:user-setting-modal', () => {
    modalUserSetting()
})

modalProfilSetting = () => {
    profilSettingModal = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            autoHideMenuBar: true,
            title: 'Profil Toko',
            parent: mainWindow,
            modal: true,
            width: 500,
            height: 675,
            resizable: false,
            minimizable: false
        }
    )
    profilSettingModal.loadFile('windows/profile.html')
    remote.enable(profilSettingModal.webContents)
}

ipcMain.on('load:profil-setting-modal', () => {
    modalProfilSetting()
})
modalSales = (salesNumber, title, totalSales) => {
    let width
    let height
    let frameBoolVal
    let titleBar
    let content
    let tr = ''
    switch(title) {
        case 'qty' :
            width = 700
            height = 400
            frameBoolVal = true
            titleBar = 'Edit Qty'
            db.all(`select * from sales where invoice_number = '${salesNumber}'`, (err, rows) => {
                if(err) throw err
                if(rows.length < 1) {
                    console.log(`no sales with number '${salesNumber}'`)
                } else {
                    rows.map( (row) => {
                        tr+=`<tr>
                                <td>
                                    <input type="text" class="form-control form-control-sm disable input-product-name" id="input-product-name-${row.id}" value="${row.product_name}" disabled>
                                    <input type="hidden" class="input-input-date" id="input-input-date-${row.id}" value="${row.input_date}" data-id="${row.id}">
                                    <input type="hidden" class="input-invoice-number" id="input-invoice-number-${row.id}" value="${row.invoice_number}" data-id="${row.id}">
                                    <input type="hidden" class="input-cost-of-product" id="input-cost-of-product-${row.id}" value="${row.harga_modal}" data-id="${row.id}">
                                    <input type="hidden" class="input-total" id="input-total-${row.id}" value="${row.total}" data-id="${row.id}">
                                    <input type="hidden" class="input-prd-price" id="input-prd-price-${row.id}" value="${row.harga_jual}" data-id="${row.id}">
                                </td>
                                <td>
                                    <input type="text" class="form-control form-control-sm disable input-product-code" id="input-product-code-${row.id}" value="${row.product_code}" disabled>    
                                </td>
                                <td>
                                    <input type="text" class="form-control form-control-sm input-qty" onkeyup="newTotal(${row.id})" value="${row.qty}" id="input-qty-${row.id}" data-id="${row.id}">
                                </td>
                            </tr>`
                    })
                    content = `<div class="table-responsive">
                                    <table class="table table-sm table-borderless" style="font-size:13px;">
                                        <thead class="thead-light">
                                            <tr>
                                                <th>Nama Produk</th>
                                                <th>Kode Produk</th>
                                                <th>Qty</th>
                                                
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${tr}
                                        </tbody>
                                    </table>    
                                </div>`
                }
            })
            
            break;
        case 'checkout' :
            width = 400
            height = 400
            frameBoolVal = true
            titleBar = 'checkout'
            // let sales_number
            // db.all(`select sum(total) as total_sales from sales where invoice_number = '${sales_number}'`, (err, row) => {
            //     if(err) throw err
            //     let total_sales = row[0].total_sales
            //     $('#total-and-tax, #info-total-sales').html(numberFormat(total_sales))
            //     $('#input-total-and-tax').val(total_sales)
         
            // })
            content = `<div class="table-responsive">
                            <table class="table table-borderless mb-5">
                                <tbody>
                                    <tr>
                                        <td>Total Belanja</td>
                                        <td><input type="text" id="total-sales" style="text-align:right;font-size:20px;" class="form-control" disabled  value="${totalSales}"></td>
                                    </tr>
                                    <tr>
                                        <td>Total Diterima</td>
                                        <td><input type="text" id="total-received" style="text-align:right;font-size:20px;" class="form-control" onkeyup="cashReturn()" autofocus></td>
                                    </tr>
                                </tbody>
                            </table>
                            <table class="table table-borderless">
                                <tbody>
                                    <tr style="background-color:red;color:white">
                                        <td><span style="font-size:18px;">Kembali</span></td>
                                        <td><input type="hidden" id="total-returned" value="0"><span class="float-end" id="info-total-returned" style="font-size:20px;font-weight:bold">0</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>`
                break;
            
    }

    salesModal = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            autoHideMenuBar: true,
            width: width,
            height: height,
            parent: cashierWindow,
            modal: true,
            resizable: false,
            minimizable: false,
            frame: frameBoolVal,
            title: titleBar
        }
    )
    remote.enable(salesModal.webContents)
    salesModal.loadFile('windows/edit.html')
    salesModal.webContents.on('dom-ready', () => {
        salesModal.webContents.send('load:tbody-tr', content, title, )
    })
}

ipcMain.on('load:sales-modal', (e, msgSalesNumber, msgTitle, msgTotalSales) => {
    modalSales(msgSalesNumber, msgTitle, msgTotalSales)
})

ipcMain.on('update-success:sales-edit', () => {
    salesModal.close()
    cashierWindow.webContents.send('update-success:sales-edit')
})

ipcMain.on('print:sales', (e, msgTotalSales, msgTotalReceived, msgTotalReturned, msgDocId) => {
    printSales(salesNum, msgTotalSales, msgTotalReceived, msgTotalReturned, msgDocId)
})

numberFormat = (number) => {
    let numFormat = new Intl.NumberFormat('de-DE').format(number)
    return numFormat
}
printSales = (salesNumber, totalSales, totalReceived, totalReturned, docId) => {
    printSalesPage = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            autoHideMenuBar: true
        }
    )

    let salesDate
    let d = new Date()
    let date = d.getDate().toString().padStart(2,0)
    let month = (d.getMonth() + 1 ).toString().padStart(2,0)
    let year = d.getFullYear()
    salesDate = `${date}/${month}/${year}`
    

    let storeInfo = {}
    db.all(`select * from profil order by id asc limit 1`, (err, row) => {
        if(err) throw err
        if(row.length < 1) {
            storeInfo.name = 'My Store'
            storeInfo.address = 'Address'
            storeInfo.telp = ''
            storeInfo.logo = 'shop.png'
        } else {
            storeInfo.name = row[0].store_name
            storeInfo.address = row[0].store_address
            if(row[0].phone_number == "" || row[0].phone_number == null) {
                storeInfo.telp = ""
            } else {
                storeInfo.telp = `| Telp. ${row[0].phone_number}`
            }
            if(row[0].logo == "") {
                storeInfo.logo = 'shop.png'
            } else {
                storeInfo.logo = row[0].logo
            }
        }
    })

    let salesHeader = {
        date: salesDate,
        number: salesNumber,
    }
    
    let salesRecord = ''
    db.all(`select * from sales where invoice_number = '${salesNumber}'`, (err, rows) => {
        if(err) throw err
        if(rows.length < 1) {
            console.log('no sales to print')
        } else {
            let subtotal = 0
            salesHeader.admin = rows[0].sales_admin
            rows.map( row => {
                subtotal+=parseFloat(row.total)
                salesRecord += `<tr>
                                    <td>${row.product_name} (${row.qty})</td>
                                    <td><span class="float-end">${numberFormat(row.total)}</span></td>
                                </tr>`
                salesFooter.subTotal = numberFormat(subtotal)
            })
        }
    })

    let salesFooter = {
        grandTotal: numberFormat(totalSales),
        totalCashReceived: numberFormat(totalReceived),
        totalCashReturned: numberFormat(totalReturned)
    }


    remote.enable(printSalesPage.webContents)

    printSalesPage.loadFile('windows/struk.html')

    printSalesPage.webContents.on('dom-ready', () => {
        printSalesPage.webContents.send('load:print', salesRecord, storeInfo, salesHeader, salesFooter)
    })

}

ipcMain.on('print:bukti', (e, docId) => {
            
    switch(docId) {
        case 'cashier' :
            cashierWindow.webContents.send('load:blank-sales')
            salesModal.close()
            break;
    }
    
    printSalesPage.webContents.print({
        printBackground: true
    }), () => {
        db.run(`insert into bukti(invoice_number, print_status) values('${salesNumber}', 'printed')`, err => {
            if(err) throw err
        })
        printSalesPage.close()
        salesNum = ""
    }

    printSalesPage.on('close', () => {
        printSalesPage = null
        salesNum = ""
    })
})
