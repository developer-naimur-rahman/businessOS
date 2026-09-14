import React from 'react';

interface TableColumn<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({ data, columns, isLoading, emptyMessage = "No data available", onRowClick }: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full h-32 flex flex-col items-center justify-center bg-white rounded-md border border-slate-200">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
        <span className="text-sm text-slate-500">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white rounded-md border border-slate-200 shadow-sm custom-scrollbar">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                className={`px-4 py-3 font-medium tracking-wider ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`bg-white hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`px-4 py-2.5 text-slate-700 ${col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {col.cell 
                      ? col.cell(item) 
                      : col.accessorKey 
                        ? String(item[col.accessorKey] ?? '') 
                        : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
