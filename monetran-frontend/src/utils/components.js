import React from 'react';

export const renderStatus = (status) => {
  switch (status) {
    case 0:
      return <StatusSpan classname="pending" text="Pending" />;
    case 1:
      return <StatusSpan classname="success" text="Successful" />;
    case 2:
      return <StatusSpan classname="fail" text="Declined" />;
    default:
      return <StatusSpan classname="pending" text="Pending" />;
  }
};

const StatusSpan = ({ classname, text }) => <span className={classname}>{text}</span>;
