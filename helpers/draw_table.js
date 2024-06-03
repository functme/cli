const inquirer = require('inquirer');
const colors = require('colors/safe');

const stripColors = str => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

const renderLine = (columns, rows, index, color) => {
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
      outlineColorize(`╒`) +
      columnData.map(c => {
        return outlineColorize(`═`.repeat(c.maxLength + minPad * 2))
      }).join(outlineColorize('╤')) +
      outlineColorize(`╕`) + '\n' +
      outlineColorize(`  │`) +
      columnData.map(c => {
        const item = c.name + '';
        return Array(minPad).fill(' ').join('') +
          item +
          Array(c.maxLength - item.length + 1).fill(' ').join('');
      }).join(outlineColorize('│')) +
      outlineColorize(`│`) + '\n' +
      outlineColorize(`  ╞`) +
      columnData.map(c => {
        return outlineColorize(`═`.repeat(c.maxLength + minPad * 2));
      }).join(outlineColorize('╪')) +
      outlineColorize(`╡`)
    );
  } else if (index === 'bottom') {
    return (
      outlineColorize(`└`) +
      columnData.map(c => {
        return outlineColorize(`─`.repeat(c.maxLength + minPad * 2));
      }).join(outlineColorize('┴')) +
      outlineColorize(`┘`)
    );
  } else if (index === 'middle') {
    return (
      outlineColorize(`├`) +
      columnData.map(c => {
        return outlineColorize(`─`.repeat(c.maxLength + minPad * 2));
      }).join(outlineColorize('┼')) +
      outlineColorize(`┤`)
    );
  } else if (index === 'bottom-cancel') {
    return (
      outlineColorize(`└`) +
      columnData.map(c => {
        return outlineColorize(`─`.repeat(c.maxLength + minPad * 2));
      }).join(outlineColorize('─')) +
      outlineColorize(`┘`)
    );
  } else if (index === 'middle-cancel') {
    return (
      outlineColorize(`├`) +
      columnData.map(c => {
        return outlineColorize(`─`.repeat(c.maxLength + minPad * 2));
      }).join(outlineColorize('┴')) +
      outlineColorize(`┤`)
    );
  } else if (index === -1) {
    const length = columnData.reduce((sum, c) => {
      return sum + c.maxLength + minPad * 2;
    }, 0);
    const item = `${colors.bold.red('x')} cancel`;
    return (
      colorize(`│ `) +
      item + 
      Array(length - stripColors(item).length).fill(' ').join('') +
      colorize(` │`)
    );
  } else {
    return (
      colorize(`│`) +
      columnData.map(c => {
        const item = rows[index][c.name] + '';
        return Array(minPad).fill(' ').join('') +
          item +
          Array(c.maxLength - stripColors(item).length + 1).fill(' ').join('');
      }).join(colorize('│')) +
      colorize(`│`)
    );
  }
};

module.exports = {
  render: (columns, rows, color = 'grey') => {
    console.log([].concat(
      '  ' + renderLine(columns, rows, 'top', color),
      rows.map((row, i) => {
        return '  ' + renderLine(columns, rows, i, color);
      }),
      '  ' + renderLine(columns, rows, 'bottom', color)
    ).join('\n'));
    return true;
  },
  selectIndexFromTable: async (title, columns, rows, color = 'grey') => {
    const result = await inquirer.prompt([
      {
        name: 'index',
        type: 'list',
        message: title,
        loop: false,
        pageSize: 100,
        choices: [].concat(
          new inquirer.Separator(
            renderLine(columns, rows, 'top', color)
          ),
          rows.map((_, i) => {
            return {
              name: renderLine(columns, rows, i, color),
              value: i
            }
          }),
          new inquirer.Separator(
            renderLine(columns, rows, 'middle-cancel', color)
          ),
          {
            name: renderLine(columns, rows, -1, color),
            value: -1
          },
          new inquirer.Separator(
            renderLine(columns, rows, 'bottom-cancel', color)
          )
        )
      }
    ]);
    return result.index;
  }
};
