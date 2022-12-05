import React from 'react';

import {ExportButton} from 'ra-ui-materialui';
import { downloadCSV } from 'react-admin';
import jsonExport from 'jsonexport/dist';
import XLSX from 'xlsx';

export function exporter({ rows, fields, filename = 'data', type = 'csv' }) {

  rows = [...rows];

  fields = fields ? [...fields] :  Object.keys( rows[0] );
  let index = fields.indexOf('site'); // 'site' may be included in the object, but should generally not be included in the export
  if (index > -1) fields.splice(index, 1);
  index = fields.indexOf('can'); // 'can' may be included in the object, but should never be included in the export
  if (index > -1) fields.splice(index, 1);

  if (rows.length > 0) {

    let rowsForExport = rows.map(row => {
      const rowForExport = {};
      fields.forEach((field) => {
        rowForExport[field] = row[field] ? row[field] : '';
      });
      if (fields.includes('location') && rowForExport.location) rowForExport.location = JSON.stringify(rowForExport.location);
      // if (fields.includes('extraData') && rowForExport.extraData) rowForExport.extraData = JSON.stringify(rowForExport.extraData);
      return rowForExport;
    });
    let parsed = parseRowsForExport(rowsForExport);
    rowsForExport = parsed.rowsForExport;
    parsed.deletedKeys.forEach(key => {
      let index = fields.indexOf(key);
      if (index > -1) fields.splice(index, 1);
    });;

    if (type == 'xlsx') {

      if (!filename.match(/\.(?:${type})/)) {
        filename = `${filename}.${type}`;
      }
      
      let ws_name = "data";
      let wb = XLSX.utils.book_new()
      let ws = XLSX.utils.json_to_sheet( rowsForExport );
      XLSX.utils.book_append_sheet(wb, ws, ws_name);

      XLSX.writeFile(wb, filename);
      
    } else {

      jsonExport(rowsForExport, {headers: fields}, (err, csv) => {
        downloadCSV(csv, 'filename');
      });

    }
  }

};


export function parseRowsForExport(rows) {
  let deletedKeys = {};
  rows = rows.map(row => {
    Object.keys(row).forEach(key => {
      let field = row[key]
      if (field && typeof field == 'object') {
        Object.keys(field).forEach(fieldkey => {
          let value = field[fieldkey];
          if (typeof value == 'object') {
            value = JSON.stringify(value);
          }
          row[`${key}.${fieldkey}`] = value;
        });
        delete row[key];
        deletedKeys[key] = true;
      }
    });
    return row;
  });
  return { rowsForExport: rows, deletedKeys: Object.keys(deletedKeys) }
}


export function ExportButtons(props) {

  let { total, data, fields, filename } = props;

  let exportFunction = exporter;
  if (props.exporter) exportFunction = props.exporter;
  
  return (
    <>
      <ExportButton
        exporter={rows => exportFunction({ rows, fields, type: 'csv', filename })}
        disabled={total === 0}
        maxResults={100000}
        record={data}
        label="Export csv"
      />
      <ExportButton
        exporter={rows => exportFunction({ rows, fields, type: 'xlsx', filename })}
        disabled={total === 0}
        maxResults={100000}
        record={data}
        label="Export xlsx"
      />
      
    </>
  );
}
