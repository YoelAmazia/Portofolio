yearSelect = () => {
    let yearOptions = '';
    let selected;
    db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, (err, rows) => {
      if (rows.length > 1) {
        db.all(`SELECT substr(date(input_date), 1, 4) AS sales_year FROM sales LIMIT 1`, (err, row) => {
          if (err) throw err;
          let year;
          if (row.length < 1) {
            let d = new Date();
            year = parseInt(d.getFullYear());
          } else {
            year = parseInt(row[0].sales_year);
          }
          let i;
          for (i = 0; i < 21; i++) {
            if (year == year + i) {
              selected = 'selected';
            } else {
              selected = '';
            }
            yearOptions += `<option value="${year + i}" ${selected}>${year + i}</option>`;
          }
          $('#start-year').html(yearOptions);
        });
      } else {
        let d = new Date();
        let year = parseInt(d.getFullYear());
        let i;
        for (i = 0; i < 21; i++) {
          if (year == year + i) {
            selected = 'selected';
          } else {
            selected = '';
          }
          yearOptions += `<option value="${year + i}" ${selected}>${year + i}</option>`;
        }
        $('#start-year').html(yearOptions);
      }
    });
  };
  
  loadReport = (reportSpan, startMonth, startYear) => {
    let query;
    let endMonth;
    let endYear;
    if (startMonth == '01') {
      endMonth = '12';
      endYear = startYear;
    } else if (parseInt(startMonth) > 1) {
      endMonth = (parseInt(startMonth) - 1).toString().padStart(2, '0');
      endYear = parseInt(startYear) + 1;
    }
  
    switch(reportSpan) {
        case 'annual':
            query = `SELECT sales.*, NULL AS discount_final
            FROM
            (SELECT annual_sales.date AS date, SUM(annual_sales.total) AS total, SUM(annual_sales.cogs) AS cogs
            FROM
            (SELECT substr(sales_table.sales_date, 1, 7) AS date, sales_table.total AS total, sales_table.cogs AS cogs
            FROM
            (SELECT date(input_date) AS sales_date, SUM(total) AS total, SUM((qty * harga_modal)) AS cogs
            FROM sales
            WHERE substr(date(input_date), 1, 7) BETWEEN '${startYear}-${startMonth}' AND '${endYear}-${endMonth}'
            GROUP BY sales_date) AS sales_table) AS annual_sales
            GROUP BY annual_sales.date) AS sales`;
            break;
        case 'monthly':
            query = `SELECT sales_table.*
            FROM
            (SELECT date(input_date) AS date, SUM(total) AS total, SUM((qty * harga_modal)) AS cogs
            FROM sales
            WHERE substr(date(input_date), 1, 7) = '${startYear}-${startMonth}'
            GROUP BY date) AS sales_table`;
            break;
    }
    db.all(query, (err, rows) => {
        if(err) throw err
        let tr = ''
        let totalNetSales = 0
        let totalCogs = 0
        let totalProfit = 0
        if(rows.length < 1) {
            tr = ''
            $('#data').html(tr)
            $('#net-total-sales').html("")
            $('#total-cogs').html("")
            $('#total-profit').html("")
        } else {
            rows.map( row => {
                let netSales = 0
                netSales += row.total
                let profit = netSales - row.cogs
                totalNetSales+=netSales
                totalCogs+=row.cogs
                totalProfit+=profit
                tr += `<tr>
                            <td>${row.date}</td> 
                            <td><span class="float-end">${numberFormat(netSales)}</span></td> 
                            <td><span class="float-end">${numberFormat(row.cogs)}</span></td> 
                            <td><span class="float-end">${numberFormat(profit)}</span></td> 
                        </tr>`
            })
            $('#data').html(tr)
            $('#net-total-sales').html(numberFormat(totalNetSales))
            $('#total-cogs').html(numberFormat(totalCogs))
            $('#total-profit').html(numberFormat(totalProfit))
      }
    });
  };
  
  setDate = () => {
    yearSelect();
    let d = new Date();
    let month = (d.getMonth() + 1).toString().padStart(2, '0');
    let year = d.getFullYear();
    switch (doc_id) {
      case 'sales-report':
        $(`#start-month option[value="${month}"]`).prop('selected', true);
        let reportSpan = $('#report-span').val();
        let startMonth = month;
        let startYear = year;
  
        loadReport(reportSpan, startMonth, startYear);
        break;
      case 'chart':
        $(`#daily-sales-month option[value="${month}"]`).prop('selected', true);
        $(`#monthly-sales-month option[value="${month}"]`).prop('selected', true);
        $(`#top-sales-month option[value="${month}"]`).prop('selected', true);
  
        dailySalesChart(month, year);
        monthlySalesChart(month, year);
        topSalesChart(month, year);
        break;
    }
  };
  
  changeDate = () => {
    let reportSpan = $('#report-span').val();
    let startMonth = $('#start-month').val();
    let startYear = $('#start-year').val();
    loadReport(reportSpan, startMonth, startYear);
  };
  
  printSalesReport = (join_ids = false) => {
    let docId = $('body').attr('id');
    let reportSpan = $('#report-span').val();
    let startMonth = $('#start-month').val();
    let startYear = $('#start-year').val();
    let query;
    switch(reportSpan) {
        case 'annual':
            query = `SELECT sales.*, NULL AS discount_final
            FROM
            (SELECT annual_sales.date AS date, SUM(annual_sales.total) AS total, SUM(annual_sales.cogs) AS cogs
            FROM
            (SELECT substr(sales_table.sales_date, 1, 7) AS date, sales_table.total AS total, sales_table.cogs AS cogs
            FROM
            (SELECT date(input_date) AS sales_date, SUM(total) AS total, SUM((qty * harga_modal)) AS cogs
            FROM sales
            WHERE substr(date(input_date), 1, 7) BETWEEN '${startYear}-${startMonth}' AND '${endYear}-${endMonth}'
            GROUP BY sales_date) AS sales_table) AS annual_sales
            GROUP BY annual_sales.date) AS sales`;
            break;
        case 'monthly':
            query = `SELECT sales_table.*
            FROM
            (SELECT date(input_date) AS date, SUM(total) AS total, SUM((qty * harga_modal)) AS cogs
            FROM sales
            WHERE substr(date(input_date), 1, 7) = '${startYear}-${startMonth}'
            GROUP BY date) AS sales_table`;
            break;
    }
    db.all(query, (err, rows) => {
        if(err) throw err
        let tr = ''
        let totalNetSales = 0
        let totalCogs = 0
        let totalProfit = 0
        let totalInfo = {}
        if(rows.length < 1) {
            tr = ''
            $('#data').html(tr)
            $('#net-total-sales').html("")
            $('#total-cogs').html("")
            $('#total-profit').html("")
        } else {
            rows.map( row => {
                let netSales = 0
                netSales += row.total
                let profit = netSales - row.cogs
                totalNetSales+=netSales
                totalCogs+=row.cogs
                totalProfit+=profit
                tr += `<tr>
                            <td>${row.date}</td> 
                            <td><span class="float-end">${numberFormat(netSales)}</span></td> 
                            <td><span class="float-end">${numberFormat(row.cogs)}</span></td> 
                            <td><span class="float-end">${numberFormat(profit)}</span></td> 
                        </tr>`;
        });
        let thead = '';
        totalInfo.totalNetSales = numberFormat(totalNetSales);
        totalInfo.totalCogs = numberFormat(totalCogs);
        totalInfo.totalProfit = numberFormat(totalProfit);
        ipcRenderer.send('load:print-page', thead, tr, totalInfo, docId, 'Laporan Penjualan');
      }
    });
}