import React from 'react';
import { BounceLoader } from 'react-spinners';

const Loader = () => (
  <div
    key={0}
    style={{
      margin: '0', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    }}
  >
    <BounceLoader color="#0066ce" />
  </div>
);

export default Loader;
