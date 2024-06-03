const colors = require('colors/safe');

const stripColors = str => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

module.exports = {
  renderLine: (columns, rows, index, color) => {
    const columnData = columns.map(columnName => {
      const colLength = stripColors(columnName + '').length;
      const maxLength = rows.reduce((max, row) => {
        return Math.max(stripColors(row[columnName] + '').length, max);
      }, colLength);
      return {
        name: columnName,
        maxLength
      };
    });
    const outlineColorize = colors.reset[color] || colors.reset;
    const colorize = colors[color] || (v => v);
    const minPad = 1;
    if (index === 'top') {
      return (
        outlineColorize(`╔`) +
        columnData.map(c => {
          return outlineColorize(`═`.repeat(c.maxLength + minPad * 2))
        }).join(outlineColorize('╦')) +
        outlineColorize(`╗`) + '\n' +
        outlineColorize(`  ║`) +
        columnData.map(c => {
          const item = c.name + '';
          return Array(minPad).fill(' ').join('') +
            item +
            Array(c.maxLength - item.length + 1).fill(' ').join('');
        }).join(outlineColorize('║')) +
        outlineColorize(`║`) + '\n' +
        outlineColorize(`  ╠`) +
        columnData.map(c => {
          return outlineColorize(`═`.repeat(c.maxLength + minPad * 2));
        }).join(outlineColorize('╬')) +
        outlineColorize(`╣`)
      );
    } else if (index === 'bottom') {
      return (
        outlineColorize(`╚`) +
        columnData.map(c => {
          return outlineColorize(`═`.repeat(c.maxLength + minPad * 2));
        }).join(outlineColorize('╩')) +
        outlineColorize(`╝`)
      );
    } else {
      return (
        colorize(`║`) +
        columnData.map(c => {
          const item = rows[index][c.name] + '';
          return Array(minPad).fill(' ').join('') +
            item +
            Array(c.maxLength - stripColors(item).length + 1).fill(' ').join('');
        }).join(colorize('║')) +
        colorize(`║`)
      );
    }
  }
};
