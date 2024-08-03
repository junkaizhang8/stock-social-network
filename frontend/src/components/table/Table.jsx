const Table = ({ data, getName, getData, caption }) => {
  return (
    <table>
      <caption>{caption}</caption>

      <thead>
        <tr style={styles.tableHead}>
          <th scope="col" style={styles.tableHeadTitle}></th>
          {data.map((item, i) => {
            return (
              <th scope="col" id={i}>{getName(i)}</th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {data.map((x, i) => {
          return (
            <tr style={styles.tableBodyTitle}>
              <th scope="row" id={i}>{getName(i)}</th>
              {data.map((y, j) => {
                return (
                  <td id={j} style={styles.tableBodyEntry}>{getData(i, j)}</td>
                )
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const styles = {
  tableHead: {
  },
  tableHeadTitle: {
  },
  tableBodyTitle: {

  },
  tableBodyEntry: {

  }
};
export default Table;
