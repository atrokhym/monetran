import React from 'react';

const Pagination = props => {
  const links = [];

  for (let i = 1; i < props.pages; i++) {
    let active = props.currentPage === i ? 'active' : '';
    links.push(
      <li
        className={`pagination-list ${active}`}
        key={i}
        onClick={() => props.nextPage(i)}
      >
        <a href="#" onClick={e => e.preventDefault()}>
          {i}
        </a>{' '}
        {/*eslint-disable-line*/}
      </li>,
    );
  }
  return (
    <div className="pagination-container">
      <div className="row">
        <ul className="pagination">
          {props.currentPage > 1 ? (
            <li
              className="pagination-list"
              onClick={() => props.nextPage(props.currentPage - 1)}
            >
              <a href="#" onClick={e => e.preventDefault()}>
                {' '}
                Prev
              </a>{' '}
            </li>
          ) : (
            ''
          )}
          {links}
          {props.currentPage < props.pages + 1 ? (
            <li
              className="pagination-list"
              onClick={() => props.nextPage(props.currentPage + 1)}
            >
              <a href="#" onClick={e => e.preventDefault()}>
                Next
              </a>{' '}
            </li>
          ) : (
            ''
          )}
        </ul>
      </div>
    </div>
  );
};

export default Pagination;
