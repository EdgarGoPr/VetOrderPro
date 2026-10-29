import type { Account, Order } from '../../types';
import { formatDate, formatFullItemQuantity } from '../../utils/formatters';

interface PrintableOrderSheetProps {
  order: Order;
  account: Account;
  className?: string;
  isPrintOnly?: boolean;
}

const ITEMS_PER_PAGE = 17;

export const PrintableOrderSheet: React.FC<PrintableOrderSheetProps> = ({
  order,
  account,
  className = '',
  isPrintOnly = false,
}) => {
  const items = order.items || [];
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  // Generate chunks of exactly 17 rows per page
  const pagesData = Array.from({ length: totalPages }, (_, pageIndex) => {
    const start = pageIndex * ITEMS_PER_PAGE;
    const pageItems = items.slice(start, start + ITEMS_PER_PAGE);
    const emptyRowsCount = ITEMS_PER_PAGE - pageItems.length;
    return {
      pageNumber: pageIndex + 1,
      items: pageItems,
      emptyRowsCount,
      startIndex: start,
    };
  });

  return (
    <div className={`printable-sheet-container ${isPrintOnly ? 'print-only hidden' : ''} ${className}`}>
      {pagesData.map((page) => (
        <div
          key={`page-${page.pageNumber}`}
          className="print-page-sheet bg-white text-stone-900 mx-auto my-6 p-10 md:p-12 shadow-lg border border-stone-200/80 rounded-sm relative flex flex-col justify-between"
          style={{
            width: '100%',
            maxWidth: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Section */}
          <div>
            <div className="flex items-start justify-between border-b-2 border-stone-900 pb-4 mb-5">
              {/* Account Branding / Membrete */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 border-2 border-stone-900 flex items-center justify-center bg-stone-50 font-serif text-2xl font-bold tracking-wider text-stone-900 shadow-xs">
                  {account.iniciales || 'VET'}
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 leading-tight">
                    {account.nombre}
                  </h1>
                  {account.bajada && (
                    <p className="text-xs uppercase tracking-wider text-stone-600 mt-0.5 font-sans">
                      {account.bajada}
                    </p>
                  )}
                  <span className="inline-block mt-1 text-[10px] uppercase font-mono tracking-widest text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                    {account.tipo || 'Veterinaria'}
                  </span>
                </div>
              </div>

              {/* Date and Order Number */}
              <div className="text-right">
                <div className="text-xs uppercase font-mono tracking-wider text-stone-500">
                  Orden N° <span className="font-bold text-stone-900">{order.numero}</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-xs text-stone-600 font-sans mr-2">Fecha:</span>
                  <span className="font-mono font-medium text-stone-900 border-b border-stone-800 pb-0.5 px-2">
                    {formatDate(order.fecha, 'printable')}
                  </span>
                </div>
              </div>
            </div>

            {/* Title & Provider */}
            <div className="text-center my-6">
              <h2 className="font-serif text-2xl md:text-3xl font-extrabold tracking-widest text-stone-900 uppercase">
                Orden de Compra
              </h2>
              <div className="mt-2 text-xs md:text-sm text-stone-700 tracking-wide flex items-center justify-center gap-2">
                <span className="font-semibold uppercase text-stone-500 tracking-wider">
                  Laboratorio / Proveedor:
                </span>
                {order.laboratorio && order.laboratorio.trim() ? (
                  <span className="font-bold text-stone-900 text-base border-b-2 border-stone-800 px-3 py-0.5">
                    {order.laboratorio}
                  </span>
                ) : (
                  <span className="inline-block w-64 border-b border-stone-500 border-dashed translate-y-1"></span>
                )}
              </div>
            </div>

            {/* 17 Fixed-Row Table */}
            <div className="border border-stone-900 mt-4 overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-stone-100/80 border-b border-stone-900 text-[11px] font-mono tracking-wider text-stone-700 uppercase">
                    <th className="w-[10%] py-2.5 px-3 text-center border-r border-stone-900 font-bold">
                      N°
                    </th>
                    <th className="w-[62%] py-2.5 px-4 border-r border-stone-900 font-bold">
                      Medicamento / Vacuna / Insumo
                    </th>
                    <th className="w-[28%] py-2.5 px-4 text-left font-bold">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300 text-xs">
                  {/* Real Items */}
                  {page.items.map((item, idx) => {
                    const rowNumber = String(page.startIndex + idx + 1).padStart(2, '0');
                    return (
                      <tr key={`item-${idx}`} className="h-[36px] hover:bg-stone-50/50">
                        <td className="text-center font-mono text-stone-600 border-r border-stone-900 px-2 py-1 font-medium">
                          {rowNumber}
                        </td>
                        <td className="px-4 py-1 border-r border-stone-900 text-stone-900 truncate">
                          <span className="font-semibold text-stone-900">{item.nombre}</span>
                          {item.presentacion && (
                            <span className="text-stone-500 text-[11px] ml-2 italic">
                              ({item.presentacion})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-1 font-mono font-medium text-stone-900">
                          {formatFullItemQuantity(item.cantidad, item.unidad, item.presentacion)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty Ruled Rows to complete strictly 17 rows */}
                  {Array.from({ length: page.emptyRowsCount }).map((_, emptyIdx) => {
                    const rowNumber = String(page.startIndex + page.items.length + emptyIdx + 1).padStart(2, '0');
                    return (
                      <tr key={`empty-${emptyIdx}`} className="h-[36px]">
                        <td className="text-center font-mono text-stone-300 border-r border-stone-900 px-2 py-1">
                          {rowNumber}
                        </td>
                        <td className="px-4 py-1 border-r border-stone-900 text-stone-200">
                          &nbsp;
                        </td>
                        <td className="px-4 py-1 text-stone-200">
                          &nbsp;
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Observations if any */}
            {order.observaciones && page.pageNumber === totalPages && (
              <div className="mt-4 p-2.5 border border-dashed border-stone-300 bg-stone-50/60 text-xs text-stone-700">
                <span className="font-semibold font-mono uppercase text-[10px] tracking-wider text-stone-500 block mb-0.5">
                  Observaciones / Instrucciones de entrega:
                </span>
                <p className="italic">{order.observaciones}</p>
              </div>
            )}
          </div>

          {/* Footer Section: Signatures & Pagination */}
          <div className="mt-8 pt-4">
            <div className="grid grid-cols-2 gap-12 px-6 mb-8">
              <div className="text-center">
                <div className="border-t border-stone-800 pt-1.5 w-3/4 mx-auto">
                  <p className="text-xs uppercase tracking-wider font-semibold text-stone-800">
                    Firma autorizada
                  </p>
                  <p className="text-[10px] text-stone-500">Médico Veterinario / Responsable</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-stone-800 pt-1.5 w-3/4 mx-auto">
                  <p className="text-xs uppercase tracking-wider font-semibold text-stone-800">
                    Aclaración y DNI
                  </p>
                  <p className="text-[10px] text-stone-500">Matrícula Profesional</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-stone-200 pt-2 text-[10px] font-mono text-stone-500">
              <div>
                <span>VetOrder Pro</span> • <span>{account.nombre}</span>
              </div>
              <div className="font-bold text-stone-700">
                Hoja {page.pageNumber} de {totalPages}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
