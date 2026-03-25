

from app.dataStores import DataStore, _ArmTelemetryData, _ArmPathData, _SortingData, _BoundaryData, _ParserArguments


class ArmData:
    def __init__(self):
        self.telemetry = DataStore(_ArmTelemetryData())
        self.path = DataStore(_ArmPathData())
        self.sorting = DataStore(_SortingData())
        self.boundary = DataStore(_BoundaryData())
        self.parser_args = DataStore(_ParserArguments())



