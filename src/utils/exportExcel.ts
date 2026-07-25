type ExportColumn = {
    header: string
    key: string
    width?: number
}

type ExportOptions = {
    data: Record<string, string | number | boolean | Date | undefined>[]
    columns: ExportColumn[]
    sheetName: string
    fileName: string
}

export async function exportObjectsToXlsx({ data, columns, sheetName, fileName }: ExportOptions) {
    const { default: writeExcelFile } = await import('write-excel-file/browser')
    const columnDefinitions = columns.map(({ header, key, width }) => ({
        header: {
            value: header,
            fontWeight: 'bold' as const,
        },
        cell: (row: Record<string, string | number | boolean | Date | undefined>) => ({
            value: row[key],
        }),
        width,
    }))

    await writeExcelFile(data, {
        sheet: sheetName,
        columns: columnDefinitions,
    }).toFile(fileName)
}
