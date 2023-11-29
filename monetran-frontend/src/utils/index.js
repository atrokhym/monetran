import { CLOUDINARY_CLOUD_NAME } from './config';
import appService from '../services/appService';

export const UploadToCloudinary = (preset, tags, next, reject) => {
  const widget = window.cloudinary.createUploadWidget(
    {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      upload_preset: preset,
      tags: tags,
    },
    (err, result) => {
      if (err) {
        reject();
      }
      if (result && result.length > 0) {
        next();
      }
    },
  );
  return widget;
};

export const viewGCSObject = async e => {
  e.preventDefault();
  const url = await appService.getObjectUrl(e.target.id);
  window.open(url, '_blank');
};

export const calculateWithdrawalPercentage000 = amount => {
  if (amount < 100) {
    return Math.max(1, (amount / 100) * 1);
  } else if (amount >= 100 && amount < 500) {
    return (amount / 100) * 1;
  } else if (amount >= 500 && amount < 10000) {
    return (amount / 100) * 0.5;
  } else if (amount >= 10000 && amount < 50000) {
    return (amount / 100) * 0.25;
  } else if (amount >= 50000) {
    return (amount / 100) * 0.1;
  } else {
    return Math.max(1, (amount / 100) * 1);
  }
};

export const calculateWithdrawalPercentage = amount => {
  if (amount <= 200) {
    return 2;
  } else if (amount > 200 && amount <= 500) {
    return (amount / 100) * 1;
  } else if (amount > 500 && amount <= 10000) {
    return (5 + (((amount - 500) / 100) * .5));
  } else if (amount > 10000 && amount <= 50000) {
    return (52.5 + (((amount - 10000) / 100) * .25));
  } else if (amount > 50000) {
    return (152.5 + (((amount - 50000) / 100) * .1));
  } else {
    return Math.max(2, (amount / 100) * 1);
  }
};
