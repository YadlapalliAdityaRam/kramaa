import React from 'react';
import ProblemForm from '../../components/admin/forms/ProblemForm';

const CreateProblem = () => {
    return (
        <div className="dashboard-container">
            <ProblemForm isEdit={false} />
        </div>
    );
};

export default CreateProblem;
