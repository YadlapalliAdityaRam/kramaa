import { useSelector } from 'react-redux';

const RoleBasedComponent = ({ allowedRoles, children }) => {
    const { user } = useSelector((state) => state.auth);

    if (user && allowedRoles.includes(user.role)) {
        return children;
    }

    return null;
};

export default RoleBasedComponent;
