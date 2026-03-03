import React from 'react';
import ContestForm from '../../components/admin/forms/ContestForm';

const CreateContest = () => {
    return (
        <div className="dashboard-container">
            <ContestForm isEdit={false} />
        </div>
    );
};

export default CreateContest;
