import React from 'react';
import PropTypes from 'prop-types';
import { 
  FaTrophy, FaMoneyBillWave, FaTicketAlt, FaDice, 
  FaStar, FaRegStar, FaGem, FaCrown, 
  FaEuroSign, FaDollarSign, FaCoins, FaWallet,
  FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import { FaLeaf } from 'react-icons/fa';

import {
  BsFillDiamondFill, BsGrid3X3, BsCashCoin, 
  BsPatchCheck, BsTrophy, BsAward
} from 'react-icons/bs';

const LotteryIcon = ({ name, size = 24, color, className }) => {
  const iconStyle = {
    fontSize: size,
    color: color || 'currentColor'
  };

  const getIcon = () => {
    switch (name) {
      case 'euromillions':
        return <FaEuroSign style={iconStyle} className={className} />;
      case 'eurojackpot':
        return <FaCrown style={iconStyle} className={className} />;
      case 'powerball':
        return <BsFillDiamondFill style={iconStyle} className={className} />;
      case 'megamillions':
        return <FaDollarSign style={iconStyle} className={className} />;
      case 'lotto':
        return <BsGrid3X3 style={iconStyle} className={className} />;
      case 'clover':
        return <FaLeaf style={iconStyle} className={className} />;
      case 'ticket':
        return <FaTicketAlt style={iconStyle} className={className} />;
      case 'jackpot':
        return <FaTrophy style={iconStyle} className={className} />;
      case 'money':
        return <FaMoneyBillWave style={iconStyle} className={className} />;
      case 'dice':
        return <FaDice style={iconStyle} className={className} />;
      case 'star':
        return <FaStar style={iconStyle} className={className} />;
      case 'star-outline':
        return <FaRegStar style={iconStyle} className={className} />;
      case 'gem':
        return <FaGem style={iconStyle} className={className} />;
      case 'coins':
        return <FaCoins style={iconStyle} className={className} />;
      case 'wallet':
        return <FaWallet style={iconStyle} className={className} />;
      case 'calendar':
        return <FaCalendarAlt style={iconStyle} className={className} />;
      case 'clock':
        return <FaClock style={iconStyle} className={className} />;
      case 'success':
        return <FaCheckCircle style={iconStyle} className={className} />;
      case 'error':
        return <FaTimesCircle style={iconStyle} className={className} />;
      case 'cash':
        return <BsCashCoin style={iconStyle} className={className} />;
      case 'verified':
        return <BsPatchCheck style={iconStyle} className={className} />;
      case 'trophy':
        return <BsTrophy style={iconStyle} className={className} />;
      case 'award':
        return <BsAward style={iconStyle} className={className} />;
      default:
        return <FaTicketAlt style={iconStyle} className={className} />;
    }
  };

  return getIcon();
};

LotteryIcon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.number,
  color: PropTypes.string,
  className: PropTypes.string
};

export default LotteryIcon;