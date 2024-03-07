const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/:formId/filteredResponses', async (req, res) => {
    const { formId } = req.params;
    const { filters, limit, afterDate, beforeDate, offset, status, includeEditLink, sort } = req.query;

    // Validate formId parameter
    if (!formId) {
        return res.status(400).json({ error: 'Form ID is missing.' });
    }

    // Validate filters parameter
    let parsedFilters;
    try {
        parsedFilters = JSON.parse(filters);
        if (!Array.isArray(parsedFilters)) {
            throw new Error('Filters must be an array.');
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid filters. Please provide a valid JSON array.' });
    }

    // Validate limit parameter
    if (limit && (isNaN(limit) || limit < 1 || limit > 150)) {
        return res.status(400).json({ error: 'Limit must be a number between 1 and 150.' });
    }

    // Validate afterDate and beforeDate parameters
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (afterDate && !dateRegex.test(afterDate)) {
        return res.status(400).json({ error: 'Invalid afterDate format. Please provide a valid date string in the format YYYY-MM-DDTHH:mm:ss.sssZ.' });
    }
    if (beforeDate && !dateRegex.test(beforeDate)) {
        return res.status(400).json({ error: 'Invalid beforeDate format. Please provide a valid date string in the format YYYY-MM-DDTHH:mm:ss.sssZ.' });
    }

    // Validate offset parameter
    if (offset && (isNaN(offset) || offset < 0)) {
        return res.status(400).json({ error: 'Offset must be a non-negative number.' });
    }

    // Validate status parameter
    if (status && status !== 'in_progress') {
        return res.status(400).json({ error: 'Invalid status. Status must be "in_progress".' });
    }

    // Validate includeEditLink parameter
    if (includeEditLink && includeEditLink !== 'true') {
        return res.status(400).json({ error: 'Invalid includeEditLink. It must be "true".' });
    }

    // Validate sort parameter
    if (sort && sort !== 'asc' && sort !== 'desc') {
        return res.status(400).json({ error: 'Invalid sort. Sort must be "asc" or "desc".' });
    }

    try {
        const apiKey = 'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912';
        const response = await axios.get(`https://api.example.com/v1/api/forms/${formId}/submissions`, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            },
            params: {
                filters,
                limit,
                afterDate,
                beforeDate,
                offset,
                status,
                includeEditLink,
                sort
            }
        });

        const responseData = response.data;

        const filteredResponses = responseData.responses.filter(response => {
            return parsedFilters.every(filter => {
                const question = response.questions.find(q => q.id === filter.id);
                if (!question) return false;
                const value = question.value;

                switch (filter.condition) {
                    case 'equals':
                        return value === filter.value;
                    case 'does_not_equal':
                        return value !== filter.value;
                    case 'greater_than':
                        return value > filter.value;
                    case 'less_than':
                        return value < filter.value;
                    default:
                        return false;
                }
            });
        });

        const totalResponses = filteredResponses.length;
        const pageCount = Math.ceil(totalResponses / 150);

        res.json({
            responses: filteredResponses,
            totalResponses,
            pageCount
        });
    } catch (error) {
        console.error('Error fetching responses:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
