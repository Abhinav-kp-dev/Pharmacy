export function downloadCSV(data, filename) {
    if (!data || !data.length) return;

    // Get all unique keys from all objects
    const keys = Array.from(new Set(data.flatMap(Object.keys)));

    // Create header row
    const csvContent = [
        keys.join(','),
        ...data.map(row =>
            keys.map(key => {
                let cell = row[key] ?? '';
                // Handle objects, arrays, and strings with commas/quotes
                if (typeof cell === 'object') cell = JSON.stringify(cell);
                else cell = String(cell);
                // Escape quotes and wrap in quotes if contains comma or quote
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    cell = `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',')
        )
    ].join('\n');

    // Create and trigger download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
